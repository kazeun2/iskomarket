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
  buyer_id: string
  seller_id: string
  amount: number
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
  buyer: {
    id: string
    username: string
    avatar_url: string | null
  }
  seller: {
    id: string
    username: string
    avatar_url: string | null
  }
}

// Create transaction
export async function createTransaction(
  productId: string,
  buyerId: string,
  sellerId: string,
  amount: number,
  meetupLocation?: string,
  meetupDate?: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      product_id: productId,
      buyer_id: buyerId,
      seller_id: sellerId,
      amount,
      status: 'pending',
      meetup_location: meetupLocation || null,
      meetup_date: meetupDate || null
    })
    .select()
    .single()

  if (error) throw error
  return data as Transaction
}

// Get transaction by ID
export async function getTransaction(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      product:products(id, title, images),
      buyer:users!buyer_id(id, username, avatar_url),
      seller:users!seller_id(id, username, avatar_url)
    `)
    .eq('id', transactionId)
    .single()

  if (error) throw error
  return data as TransactionWithDetails
}

// Get user's transactions (as buyer or seller)
export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      product:products(id, title, images),
      buyer:users!buyer_id(id, username, avatar_url),
      seller:users!seller_id(id, username, avatar_url)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
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

  // Update confirmation status
  const updateField = role === 'buyer' ? 'meetup_confirmed_by_buyer' : 'meetup_confirmed_by_seller'
  
  const { data, error } = await supabase
    .from('transactions')
    .update({ [updateField]: true })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw error

  // Check if both parties confirmed
  const bothConfirmed = (role === 'buyer' && transaction.meetup_confirmed_by_seller) || 
                       (role === 'seller' && transaction.meetup_confirmed_by_buyer)

  if (bothConfirmed && data[updateField]) {
    // Mark transaction as completed
    await completeTransaction(transactionId)
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

  // Update user stats
  await supabase
    .from('users')
    .update({ successful_purchases: supabase.raw('successful_purchases + 1') })
    .eq('id', transaction.buyer_id)

  await supabase
    .from('users')
    .update({ successful_sales: supabase.raw('successful_sales + 1') })
    .eq('id', transaction.seller_id)

  // Award Iskoins to both parties
  const buyerIskoins = Math.floor(transaction.amount * 0.01) // 1% of transaction
  const sellerIskoins = Math.floor(transaction.amount * 0.02) // 2% of transaction

  // Buyer Iskoins
  const { data: buyer } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', transaction.buyer_id)
    .single()

  if (buyer) {
    const newBalance = buyer.iskoins + buyerIskoins
    
    await supabase
      .from('users')
      .update({ iskoins: newBalance })
      .eq('id', transaction.buyer_id)

    await supabase
      .from('iskoin_transactions')
      .insert({
        user_id: transaction.buyer_id,
        amount: buyerIskoins,
        type: 'earned',
        description: 'Completed purchase',
        balance_before: buyer.iskoins,
        balance_after: newBalance,
        related_id: transactionId,
        related_type: 'transaction'
      })
  }

  // Seller Iskoins
  const { data: seller } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', transaction.seller_id)
    .single()

  if (seller) {
    const newBalance = seller.iskoins + sellerIskoins
    
    await supabase
      .from('users')
      .update({ iskoins: newBalance })
      .eq('id', transaction.seller_id)

    await supabase
      .from('iskoin_transactions')
      .insert({
        user_id: transaction.seller_id,
        amount: sellerIskoins,
        type: 'earned',
        description: 'Completed sale',
        balance_before: seller.iskoins,
        balance_after: newBalance,
        related_id: transactionId,
        related_type: 'transaction'
      })
  }

  // Update credit scores positively
  const { data: buyerProfile } = await supabase
    .from('users')
    .select('credit_score')
    .eq('id', transaction.buyer_id)
    .single()

  if (buyerProfile) {
    const newBuyerScore = Math.min(100, buyerProfile.credit_score + 2)
    await supabase
      .from('users')
      .update({ credit_score: newBuyerScore })
      .eq('id', transaction.buyer_id)

    await supabase
      .from('credit_score_history')
      .insert({
        user_id: transaction.buyer_id,
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
    .eq('id', transaction.seller_id)
    .single()

  if (sellerProfile) {
    const newSellerScore = Math.min(100, sellerProfile.credit_score + 3)
    await supabase
      .from('users')
      .update({ credit_score: newSellerScore })
      .eq('id', transaction.seller_id)

    await supabase
      .from('credit_score_history')
      .insert({
        user_id: transaction.seller_id,
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

  // Only buyer or seller can cancel
  if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
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

// Get pending transactions for user
export async function getPendingTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      product:products(id, title, images),
      buyer:users!buyer_id(id, username, avatar_url),
      seller:users!seller_id(id, username, avatar_url)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as TransactionWithDetails[]
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