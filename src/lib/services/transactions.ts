/**
 * Transaction Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'
import { tableExists } from '../db'
import type { Database } from '../database.types'

type TransactionRow = Database['public']['Tables']['transactions']['Row']

export interface Transaction {
  id: string
  product_id: string | null
  // Canonical production column names: sender_id (buyer) and receiver_id (seller)
  sender_id: string
  receiver_id: string
  amount?: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
  meetup_location: string | null
  meetup_date: string | null
  payment_method: string
  meetup_confirmed_by_buyer: boolean
  meetup_confirmed_by_seller: boolean
  created_at: string
  completed_at: string | null
}

export interface TransactionWithDetails extends Transaction {
  product?: {
    id: string
    title: string
    images: string[]
  }
  // user_profile join returns `user_id` instead of `id` — accept both for compatibility
  buyer: {
    id?: string
    user_id?: string
    name?: string
    username?: string
    avatar_url?: string | null
  }
  seller: {
    id?: string
    user_id?: string
    name?: string
    username?: string
    avatar_url?: string | null
  }
}

// Create transaction
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export type CreateTransactionParams = {
  productId: string
  buyerId: string // auth UID of buyer -> maps to sender_id
  sellerId: string // auth UID of seller -> maps to receiver_id
  meetupLocation?: string | null
  meetupDate?: string | Date | null
  amount?: number
}

export async function createTransaction({
  productId,
  buyerId,
  sellerId,
  meetupLocation,
  meetupDate,
  amount,
}: CreateTransactionParams) {
  if (!buyerId || !sellerId) {
    throw new Error('Missing buyerId or sellerId when creating transaction')
  }

  // If running in browser, ensure the authenticated session matches the buyer
  if (typeof window !== 'undefined') {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser() as any
      console.log('[transactions.createTransaction] auth user', user?.id, authError)

      if (!user) {
        // Fail fast: we must be running in an authenticated browser session to create a transaction
        throw new Error('No authenticated Supabase user – cannot create transaction.')
      }

      const authUserId = user.id as string
      if (authUserId !== buyerId) {
        console.warn('[transactions.createTransaction] Provided buyerId does not match auth session user; overriding buyerId with session user', { provided: buyerId, sessionUser: authUserId })
        buyerId = authUserId // prefer authoritative session id
      }
    } catch (e: any) {
      console.error('[transactions.createTransaction] Failed to resolve auth session:', e?.message || e)
      throw e
    }
  } else {
    // Server-side or test environment: assume caller provided buyerId and sellerId explicitly
    console.log('[transactions.createTransaction] Running in non-browser context; skipping browser auth check')
  }

  // Ensure a conversation exists for this product and participant pair so messages can be linked
  let conversationId: string | null = null
  try {
    conversationId = await (await import('../../services/messageService')).getOrCreateConversation(productId, buyerId, sellerId)
  } catch (e) {
    // ignore if messageService not available or schema missing; we'll still create a transaction
    conversationId = null
  }

  // Use an untyped payload to tolerate schema drift in the transactions table until migrations are applied.
  const payload: any = {
    product_id: productId,
    // only include conversation_id when we actually have one
    ...(conversationId ? { conversation_id: conversationId } : {}),
    sender_id: buyerId,
    receiver_id: sellerId,
    status: 'pending',
    meetup_location: meetupLocation ?? null,
    meetup_date: meetupDate ? (meetupDate instanceof Date ? meetupDate.toISOString() : String(meetupDate)) : null,
    amount: amount ?? 0,
  }

  // Defensive guard to avoid null DB inserts
  if (!payload.sender_id || !payload.receiver_id) {
    throw new Error('Transaction payload missing sender_id or receiver_id')
  }

  // Log payload minimally for diagnostics (avoid full error spam)
  console.log('[transactions.createTransaction] payload keys', Object.keys(payload))

  // Guard: if transactions table is not present, fail fast with a helpful error
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available in the database. Please apply migrations before creating transactions.')
  }

  // Insert transaction (single canonical insert). If required columns are missing in DB, this will return an error which callers should handle.
  const insertResult = await supabase
    .from('transactions')
    .insert(payload)
    .select('id, product_id, conversation_id, sender_id, receiver_id, status, meetup_date, meetup_location')
    .single()

  if (insertResult.error) {
    console.error('[transactions.createTransaction] Supabase insert error', { code: insertResult.error?.code, message: insertResult.error?.message })
    throw insertResult.error
  }

  // Ensure conversation participants exist (best-effort)
  if (conversationId) {
    try {
      await supabase
        .from('conversation_participants')
        .upsert([
          { conversation_id: conversationId, user_id: buyerId, role: 'buyer' },
          { conversation_id: conversationId, user_id: sellerId, role: 'seller' },
        ], { onConflict: ['conversation_id', 'user_id'] });
    } catch (e) {
      // ignore enrichment failures
    }
  }

  const data = insertResult.data
  console.log('[transactions.createTransaction] created', { id: (data as any)?.id })
  return data as Transaction
}

// Get transaction by ID
export async function getTransaction(transactionId: string) {
  // If transactions table doesn't exist, return null (safe fallback)
  if (!(await tableExists('transactions'))) {
    console.warn('[transactions.getTransaction] transactions table does not exist; returning null')
    return null
  }

  // Fetch core transaction row (avoid relying on nested relationship names)
  const { data: txRow, error } = await supabase
    .from('transactions')
    .select('id, product_id, sender_id, receiver_id, meetup_date, meetup_location, status, created_at, conversation_id')
    .eq('id', transactionId)
    .maybeSingle()

  if (error) {
    console.error('[transactions.getTransaction] Supabase error', { code: error?.code, message: error?.message })
    throw error
  }

  if (!txRow) return null as any

  // Enrich product info if available
  let product: any = undefined
  if (txRow.product_id) {
    try {
      const { data: p } = await supabase.from('products').select('id, title, images').eq('id', txRow.product_id).maybeSingle()
      product = p || undefined
    } catch (e) {
      // ignore
    }
  }

  // Fetch buyer/seller profiles
  const ids = [txRow.sender_id, txRow.receiver_id].filter(Boolean) as string[]
  let profiles: any[] = []
  if (ids.length) {
    const { data: byId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('id', ids)
    if (byId && byId.length) profiles = byId
    else {
      const { data: byUserId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('user_id', ids)
      profiles = byUserId || []
    }
  }

  const buyer = profiles.find((p) => p.id === txRow.sender_id) || null;
  const seller = profiles.find((p) => p.id === txRow.receiver_id) || null;

  const composed: any = {
    id: txRow.id,
    product: product ? { id: product.id, title: product.title, images: product.images || [] } : undefined,
    sender_id: txRow.sender_id,
    receiver_id: txRow.receiver_id,
    buyer: buyer ? { id: buyer.id || buyer.user_id, name: buyer.display_name || buyer.username || undefined, username: buyer.username, avatar_url: buyer.avatar_url } : null,
    seller: seller ? { id: seller.id || seller.user_id, name: seller.display_name || seller.username || undefined, username: seller.username, avatar_url: seller.avatar_url } : null,
    meetup_date: txRow.meetup_date,
    meetup_location: txRow.meetup_location,
    status: txRow.status,
    created_at: txRow.created_at,
    conversation_id: txRow.conversation_id,
  }

  return composed as TransactionWithDetails
}

// Get user's transactions (as buyer or seller)
export async function getUserTransactions(userId: string) {
  // If transactions table missing - return empty list (safe fallback)
  if (!(await tableExists('transactions'))) {
    console.warn('[transactions.getUserTransactions] transactions table missing; returning empty list')
    return []
  }

  const { data: rows, error } = await supabase
    .from('transactions')
    .select('id, product_id, sender_id, receiver_id, meetup_date, meetup_location, status, created_at, conversation_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[transactions.getUserTransactions] Supabase error', { code: error?.code, message: error?.message })
    throw error
  }

  const txs = rows || []

  // Fetch unique product ids and profile ids to batch fetch
  const productIds = Array.from(new Set(txs.map((t: any) => t.product_id).filter(Boolean)))
  const userIds = Array.from(new Set(txs.flatMap((t: any) => [t.sender_id, t.receiver_id]).filter(Boolean)))

  let productsMap: Record<string, any> = {}
  if (productIds.length) {
    const { data: products } = await supabase.from('products').select('id, title, images').in('id', productIds as string[])
    productsMap = (products || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
  }

  let profilesMap: Record<string, any> = {}
  if (userIds.length) {
    const { data: byId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('id', userIds as string[])
    let profiles = byId || []
    if (!profiles.length) {
      const { data: byUserId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('user_id', userIds as string[])
      profiles = byUserId || []
    }
    profilesMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id || p.user_id] = p; return acc }, {})
  }

  const composed = (txs || []).map((t: any) => ({
    id: t.id,
    product: t.product_id ? (productsMap[t.product_id] ? { id: productsMap[t.product_id].id, title: productsMap[t.product_id].title, images: productsMap[t.product_id].images || [] } : undefined) : undefined,
    sender_id: t.sender_id,
    receiver_id: t.receiver_id,
    buyer: profilesMap[t.sender_id] ? { id: profilesMap[t.sender_id].id || profilesMap[t.sender_id].user_id, name: profilesMap[t.sender_id].display_name || profilesMap[t.sender_id].username || undefined, username: profilesMap[t.sender_id].username, avatar_url: profilesMap[t.sender_id].avatar_url } : null,
    seller: profilesMap[t.receiver_id] ? { id: profilesMap[t.receiver_id].id || profilesMap[t.receiver_id].user_id, name: profilesMap[t.receiver_id].display_name || profilesMap[t.receiver_id].username || undefined, username: profilesMap[t.receiver_id].username, avatar_url: profilesMap[t.receiver_id].avatar_url } : null,
    meetup_date: t.meetup_date,
    meetup_location: t.meetup_location,
    status: t.status,
    created_at: t.created_at,
    conversation_id: t.conversation_id,
  }))

  return composed as TransactionWithDetails[]
}

// Confirm transaction (buyer or seller)
export async function confirmTransaction(transactionId: string, userId: string, role: 'buyer' | 'seller') {
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available')
  }

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (fetchError || !transaction) throw new Error('Transaction not found')

  // Authorization: ensure the acting user is a party on the transaction (sender or receiver)
  if (transaction.sender_id !== userId && transaction.receiver_id !== userId) {
    throw new Error('Unauthorized')
  }

  // Update confirmation status
  const updateField = role === 'buyer' ? 'meetup_confirmed_by_buyer' : 'meetup_confirmed_by_seller'
  
  const { data, error } = await supabase
    .from('transactions')
    .update({ [updateField]: true })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) {
    console.error('[transactions.confirmTransaction] Supabase error', { code: error?.code, message: error?.message, details: error?.details })
    throw error
  }

  // Check if both parties confirmed attendance for the scheduled meet-up
  const bothConfirmed = (role === 'buyer' && transaction.meetup_confirmed_by_seller) || 
                       (role === 'seller' && transaction.meetup_confirmed_by_buyer)

  if (bothConfirmed && data[updateField]) {
    // Transition the transaction into SCHEDULED state (countdown begins)
    const { error: schedErr } = await supabase
      .from('transactions')
      .update({ status: 'scheduled', confirmed_at: new Date().toISOString() })
      .eq('id', transactionId)

    if (schedErr) {
      console.error('[transactions.confirmTransaction] Failed to set scheduled status', schedErr)
      throw schedErr
    }
  }

  return data as Transaction
}

// Complete transaction
export async function completeTransaction(transactionId: string) {
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available')
  }

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (!transaction) throw new Error('Transaction not found')

  // Update transaction status
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  if (updateError) throw updateError

  // Mark product as sold
  if (transaction.product_id) {
    await supabase
      .from('products')
      .update({
        is_sold: true,
        sold_at: new Date().toISOString()
      })
      .eq('id', transaction.product_id)
  }

  // Update user stats (use buyer_id/seller_id)
  await supabase
    .from('users')
    .update({ successful_purchases: supabase.raw('successful_purchases + 1') })
    .eq('id', transaction.sender_id)

  await supabase
    .from('users')
    .update({ successful_sales: supabase.raw('successful_sales + 1') })
    .eq('id', transaction.receiver_id)

  // Award Iskoins to both parties
  // If `amount` is not present on the transaction (some schemas omit it), fall back to the product price
  let txnAmount: number | undefined = (transaction as any).amount
  if ((txnAmount === undefined || txnAmount === null) && transaction.product_id) {
    try {
      const { data: prod } = await supabase.from('products').select('price').eq('id', transaction.product_id).single()
      txnAmount = prod?.price ? Number((prod as any).price) : 0
    } catch (e) {
      console.warn('[transactions.completeTransaction] Failed to fetch product price to compute iskoins', e)
      txnAmount = 0
    }
  }

  const buyerIskoins = Math.floor(Number(txnAmount || 0) * 0.01) // 1% of transaction
  const sellerIskoins = Math.floor(Number(txnAmount || 0) * 0.02) // 2% of transaction

  // Buyer Iskoins (buyer mapped to sender_id)
  const { data: buyer } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', transaction.sender_id)
    .single()

  if (buyer) {
    const newBalance = buyer.iskoins + buyerIskoins
    
    await supabase
      .from('users')
      .update({ iskoins: newBalance })
      .eq('id', transaction.sender_id)

    await supabase
      .from('iskoin_transactions')
      .insert({
        user_id: transaction.sender_id,
        amount: buyerIskoins,
        type: 'earned',
        description: 'Completed purchase',
        balance_before: buyer.iskoins,
        balance_after: newBalance,
        related_id: transactionId,
        related_type: 'transaction'
      })
  }

  // Seller Iskoins (seller mapped to receiver_id)
  const { data: seller } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', transaction.receiver_id)
    .single()

  if (seller) {
    const newBalance = seller.iskoins + sellerIskoins
    
    await supabase
      .from('users')
      .update({ iskoins: newBalance })
      .eq('id', transaction.receiver_id)

    await supabase
      .from('iskoin_transactions')
      .insert({
        user_id: transaction.receiver_id,
        amount: sellerIskoins,
        type: 'earned',
        description: 'Completed sale',
        balance_before: seller.iskoins,
        balance_after: newBalance,
        related_id: transactionId,
        related_type: 'transaction'
      })
  }

  // Update credit scores positively (use buyer_id/seller_id)
  const { data: buyerProfile } = await supabase
    .from('users')
    .select('credit_score')
    .eq('id', transaction.sender_id)
    .single()

  if (buyerProfile) {
    const newBuyerScore = Math.min(100, buyerProfile.credit_score + 2)
    await supabase
      .from('users')
      .update({ credit_score: newBuyerScore })
      .eq('id', transaction.sender_id)

    await supabase
      .from('credit_score_history')
      .insert({
        user_id: transaction.sender_id,
        score_before: buyerProfile.credit_score,
        score_after: newBuyerScore,
        change_amount: 2,
        reason: 'Completed purchase',
        related_id: transactionId,
        related_type: 'transaction'
      })
  }

  const { data: sellerProfile } = await supabase
    .from('users')
    .select('credit_score')
    .eq('id', transaction.receiver_id)
    .single()

  if (sellerProfile) {
    const newSellerScore = Math.min(100, sellerProfile.credit_score + 3)
    await supabase
      .from('users')
      .update({ credit_score: newSellerScore })
      .eq('id', transaction.receiver_id)

    await supabase
      .from('credit_score_history')
      .insert({
        user_id: transaction.receiver_id,
        score_before: sellerProfile.credit_score,
        score_after: newSellerScore,
        change_amount: 3,
        reason: 'Completed sale',
        related_id: transactionId,
        related_type: 'transaction'
      })
  }
}

// Cancel transaction
export async function cancelTransaction(transactionId: string, userId: string) {
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available')
  }

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (!transaction) throw new Error('Transaction not found')

  // Only sender or receiver can cancel
  if (transaction.sender_id !== userId && transaction.receiver_id !== userId) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('id', transactionId)

  if (error) throw error
}

// Update meetup details
export async function updateMeetupDetails(
  transactionId: string,
  meetupLocation: string,
  meetupDate: string
) {
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available')
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      meetup_location: meetupLocation,
      meetup_date: meetupDate
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

// Cancel a meetup (reset date and confirmations so users can propose again)
export async function cancelMeetup(transactionId: string, userId: string) {
  if (!(await tableExists('transactions'))) {
    throw new Error('Transactions table is not available')
  }

  // Verify user is a party to the transaction
  const { data: trx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (fetchErr || !trx) throw new Error('Transaction not found')
  if (trx.sender_id !== userId && trx.receiver_id !== userId) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('transactions')
    .update({
      meetup_date: null,
      meetup_location: null,
      status: 'pending',
      meetup_confirmed_by_buyer: false,
      meetup_confirmed_by_seller: false
    })
    .eq('id', transactionId)

  if (error) throw error
}


// Get pending transactions for user
export async function getPendingTransactions(userId: string) {
  // If transactions table missing - return empty list (safe fallback)
  if (!(await tableExists('transactions'))) {
    console.warn('[transactions.getPendingTransactions] transactions table missing; returning empty list')
    return []
  }

  // Canonical single-path implementation: select core transaction fields and enrich with product/profile data
  const { data: rows, error } = await supabase
    .from('transactions')
    .select('id, product_id, sender_id, receiver_id, meetup_date, meetup_location, status, created_at, conversation_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[transactions.getPendingTransactions] Supabase error', { code: error?.code, message: error?.message })
    throw error
  }

  const txs = rows || []

  // Batch fetch product and profiles for enrichment
  const productIds = Array.from(new Set(txs.map((t: any) => t.product_id).filter(Boolean)))
  const userIds = Array.from(new Set(txs.flatMap((t: any) => [t.sender_id, t.receiver_id]).filter(Boolean)))

  let productsMap: Record<string, any> = {}
  if (productIds.length) {
    const { data: products } = await supabase.from('products').select('id, title, images').in('id', productIds as string[])
    productsMap = (products || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
  }

  let profilesMap: Record<string, any> = {}
  if (userIds.length) {
    const { data: byId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('id', userIds as string[])
    let profiles = byId || []
    if (!profiles.length) {
      const { data: byUserId } = await supabase.from('user_profile').select('id, user_id, username, display_name, avatar_url').in('user_id', userIds as string[])
      profiles = byUserId || []
    }
    profilesMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id || p.user_id] = p; return acc }, {})
  }

  const composed = (txs || []).map((t: any) => ({
    id: t.id,
    product: t.product_id ? (productsMap[t.product_id] ? { id: productsMap[t.product_id].id, title: productsMap[t.product_id].title, images: productsMap[t.product_id].images || [] } : undefined) : undefined,
    sender_id: t.sender_id,
    receiver_id: t.receiver_id,
    buyer: profilesMap[t.sender_id] ? { id: profilesMap[t.sender_id].id || profilesMap[t.sender_id].user_id, name: profilesMap[t.sender_id].display_name || profilesMap[t.sender_id].username || undefined, username: profilesMap[t.sender_id].username, avatar_url: profilesMap[t.sender_id].avatar_url } : null,
    seller: profilesMap[t.receiver_id] ? { id: profilesMap[t.receiver_id].id || profilesMap[t.receiver_id].user_id, name: profilesMap[t.receiver_id].display_name || profilesMap[t.receiver_id].username || undefined, username: profilesMap[t.receiver_id].username, avatar_url: profilesMap[t.receiver_id].avatar_url } : null,
    meetup_date: t.meetup_date,
    meetup_location: t.meetup_location,
    status: t.status,
    created_at: t.created_at,
    conversation_id: t.conversation_id,
  }))

  return composed as TransactionWithDetails[]
}

// Subscribe to transaction updates
export function subscribeToTransaction(
  transactionId: string,
  onUpdate: (transaction: Transaction) => void
) {
  const channel = supabase
    .channel(`transaction:${transactionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions',
        filter: `id=eq.${transactionId}`
      },
      (payload) => {
        onUpdate(payload.new as Transaction)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}