/**
 * Transaction Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'
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
    username?: string
    avatar_url?: string | null
  }
  seller: {
    id?: string
    user_id?: string
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

  const payload: TransactionInsert = {
    product_id: productId,
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

  // Log payload so errors can be diagnosed in production
  console.log('[transactions.createTransaction] payload', payload)

  // Attempt to insert; if DB schema is missing optional columns (e.g. `amount`) or relationships, retry with a reduced payload
  let insertResult: any = null
  try {
    insertResult = await supabase
      .from('transactions')
      .insert(payload)
      .select('id, product_id, sender_id, receiver_id, status, meetup_date, meetup_location')
      .single()

    if (insertResult.error) {
      throw insertResult.error
    }
  } catch (err: any) {
    const msg = err?.message || String(err || '')
    console.warn('[transactions.createTransaction] Insert failed, attempting fallback if applicable', { message: msg })

    // If the error mentions the `amount` column (or similar missing optional columns), retry without `amount`
    if (msg.toLowerCase().includes('amount') || msg.toLowerCase().includes('could not find the amount') || msg.toLowerCase().includes('column "amount"')) {
      const reduced: any = { ...payload }
      delete reduced.amount
      try {
        const retry = await supabase
          .from('transactions')
          .insert(reduced)
          .select('id, product_id, sender_id, receiver_id, status, meetup_date, meetup_location')
          .single()

        if (retry.error) throw retry.error
        insertResult = retry
      } catch (retryErr: any) {
        console.error('[transactions.createTransaction] Retry without amount failed', retryErr)
        throw retryErr
      }
    } else {
      // Not a recognized fallback case — rethrow so callers can handle
      console.error('[transactions.createTransaction] Supabase error', err)
      throw err
    }
  }

  const data = insertResult.data
  console.log('[transactions.createTransaction] created', { id: (data as any)?.id, row: data })
  return data as Transaction
}

// Get transaction by ID
export async function getTransaction(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      product:products(id, title, images),
      sender_id,
      receiver_id,
      buyer:sender_id (id, display_name, avatar_url, username),
      seller:receiver_id (user_id as id, display_name, avatar_url, username),
      meetup_date,
      meetup_location,
      status,
      created_at
    `)
    .eq('id', transactionId)
    .single()

  if (error) {
    console.error('[transactions.getTransaction] Supabase error', { code: error?.code, message: error?.message, details: error?.details })

    // If relationship missing (PGRST200), fall back to simple select then fetch profiles separately
    const msg = (error?.message || '').toLowerCase();
    if (error?.code === 'PGRST200' || msg.includes('foreign key relationship') || msg.includes("could not find a relationship")) {
      console.info('[transactions.getTransaction] Relationship missing for nested join; falling back to simple select', { message: error?.message });
      const { data: simple, error: simpleErr } = await supabase
        .from('transactions')
        .select('id, product_id, sender_id, receiver_id, meetup_date, meetup_location, status, created_at')
        .eq('id', transactionId)
        .maybeSingle();

      if (simpleErr) {
        console.error('[transactions.getTransaction] fallback simple select failed', simpleErr);
        throw simpleErr;
      }

      if (!simple) return null as any;

      const ids = [simple.sender_id, simple.receiver_id].filter(Boolean) as string[];
      let profiles: any[] = [];
      if (ids.length) {
        // Try lookup by id (newer schemas) then fallback to user_id
        const { data: psById } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').in('id', ids);
        if (psById && psById.length) profiles = psById;
        else {
          const { data: psByUserId } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').in('user_id', ids);
          profiles = psByUserId || [];
        }
      }

      const buyer = profiles.find((p) => p.id === simple.sender_id) || null;
      const seller = profiles.find((p) => p.id === simple.receiver_id) || null;

      const composed: any = {
        ...simple,
        buyer: buyer ? { id: buyer.id, display_name: buyer.display_name, avatar_url: buyer.avatar_url } : null,
        seller: seller ? { id: seller.id, display_name: seller.display_name, avatar_url: seller.avatar_url } : null,
      };

      return composed as TransactionWithDetails;
    }

    throw error
  }

  return data as TransactionWithDetails
}

// Get user's transactions (as buyer or seller)
export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      product:products(id, title, images),
      sender_id,
      receiver_id,
      buyer:sender_id (user_id as id, display_name, avatar_url, username),
      seller:receiver_id (user_id as id, display_name, avatar_url, username),
      meetup_date,
      meetup_location,
      status,
      created_at
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[transactions.getUserTransactions] Supabase error', { code: error?.code, message: error?.message, details: error?.details })
    throw error
  }

  return data as TransactionWithDetails[]
}

// Confirm transaction (buyer or seller)
export async function confirmTransaction(transactionId: string, userId: string, role: 'buyer' | 'seller') {
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
  // Use canonical column names `sender_id` and `receiver_id` (buyer/seller semantics)
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        product:products(id, title, images),
        sender_id,
        receiver_id,
        buyer:sender_id (user_id as id, display_name, avatar_url, username),
        seller:receiver_id (user_id as id, display_name, avatar_url, username),
        meetup_date,
        meetup_location,
        status,
        created_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (error) throw error
    return data as TransactionWithDetails[]
  } catch (err: any) {
    // Fallback: some Supabase schemas may not have the expected foreign key relationships (e.g. user_profile join)
    // In that case, return a simple transactions list without joins to avoid failing the caller.
    const msg = err?.message || String(err || '')
    if (msg.toLowerCase().includes('relationship') || msg.toLowerCase().includes('user_profile') || err?.code === 'PGRST204') {
      console.info('[transactions.getPendingTransactions] Relationships missing, falling back to simple select (this can be resolved by ensuring FK relationships exist)', { message: msg, userId })
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

      if (fallbackError) throw fallbackError
      return fallbackData as TransactionWithDetails[]
    }

    throw err
  }
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