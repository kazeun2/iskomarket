/**
 * Rewards and Iskoin Services
 * Last Updated: December 13, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { Database } from '../database.types'

type DailySpinRow = Database['public']['Tables']['daily_spins']['Row']
type IskoinTransactionRow = Database['public']['Tables']['iskoin_transactions']['Row']

// Store admin client if provided (used for testing to bypass RLS)
let adminClient: any = null

/**
 * Set admin client for bypassing RLS in tests
 * @param client - Supabase client with service role key
 */
export function setAdminClient(client: any) {
  adminClient = client
}

/**
 * Get the appropriate Supabase client (admin if set, otherwise anonymous)
 */
function getClient() {
  return adminClient || supabase
}

// Get user's Iskoin transaction history
export async function getIskoinTransactionHistory(userId: string, limit: number = 50) {
  const { data, error } = await getClient()
    .from('iskoin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as IskoinTransactionRow[]
}

// Get total Iskoins earned by user
export async function getTotalIskoinsEarned(userId: string) {
  const { data, error } = await getClient()
    .from('iskoin_transactions')
    .select('amount')
    .eq('user_id', userId)
    .gt('amount', 0)

  if (error) throw error
  
  return data.reduce((sum, t) => sum + t.amount, 0)
}

// Add Iskoins to user account
export async function addIskoins(
  userId: string,
  amount: number,
  type: 'earned' | 'bonus' | 'spin' | 'season_unlock',
  description: string,
  relatedId?: string,
  relatedType?: string
) {
  // Get current balance
  const { data: user } = await getClient()
    .from('users')
    .select('iskoins')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const balanceBefore = user.iskoins
  const balanceAfter = balanceBefore + amount

  // Update user balance
  const { error: updateError } = await getClient()
    .from('users')
    .update({ iskoins: balanceAfter })
    .eq('id', userId)

  if (updateError) throw updateError

  // Log transaction
  const { error: logError } = await getClient()
    .from('iskoin_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      related_id: relatedId || null,
      related_type: relatedType || null
    })

  if (logError) throw logError

  return balanceAfter
}

// Deduct Iskoins from user account
export async function deductIskoins(
  userId: string,
  amount: number,
  type: 'spent' | 'redeem',
  description: string,
  relatedId?: string,
  relatedType?: string
) {
  // Get current balance
  const { data: user } = await getClient()
    .from('users')
    .select('iskoins')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')
  if (user.iskoins < amount) throw new Error('Insufficient Iskoins')

  const balanceBefore = user.iskoins
  const balanceAfter = balanceBefore - amount

  // Update user balance
  const { error: updateError } = await getClient()
    .from('users')
    .update({ iskoins: balanceAfter })
    .eq('id', userId)

  if (updateError) throw updateError

  // Log transaction
  const { error: logError } = await getClient()
    .from('iskoin_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type,
      description,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      related_id: relatedId || null,
      related_type: relatedType || null
    })

  if (logError) throw logError

  return balanceAfter
}

// Daily spin functions
export async function canUserSpin(userId: string): Promise<boolean> {
  const { data: user } = await getClient()
    .from('users')
    .select('last_spin_date')
    .eq('id', userId)
    .single()

  if (!user) return false

  const today = new Date().toISOString().split('T')[0]
  return user.last_spin_date !== today
}

export async function performDailySpin(userId: string, rewardAmount: number, rewardType: string) {
  // Check if user can spin today
  const canSpin = await canUserSpin(userId)
  if (!canSpin) throw new Error('Already spun today')

  const today = new Date().toISOString().split('T')[0]

  // Fetch current spin counts
  const { data: user } = await getClient()
    .from('users')
    .select('spin_count, total_spins')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  // Update user's last spin date and increment spin count
  const { error: userUpdateError } = await getClient()
    .from('users')
    .update({ 
      last_spin_date: today,
      spin_count: (user.spin_count || 0) + 1,
      total_spins: (user.total_spins || 0) + 1
    })
    .eq('id', userId)

  if (userUpdateError) throw userUpdateError

  // Record the spin result
  const { error: spinError } = await getClient()
    .from('daily_spins')
    .insert({
      user_id: userId,
      reward_type: rewardType,
      reward_amount: rewardAmount,
      reward_description: `${rewardType} - ${rewardAmount} Iskoins`
    })

  if (spinError) throw spinError

  // Award Iskoins if applicable
  if (rewardAmount > 0) {
    await addIskoins(
      userId,
      rewardAmount,
      'spin',
      `Daily spin reward: ${rewardAmount} Iskoins`
    )
  }

  return {
    rewardType,
    rewardAmount,
    canSpinAgain: false
  }
}

// Get user's spin history
export async function getUserSpinHistory(userId: string, limit: number = 30) {
  const { data, error } = await getClient()
    .from('daily_spins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as DailySpinRow[]
}

// Get total spins count
export async function getTotalSpinsCount(userId: string): Promise<number> {
  const { data: user } = await getClient()
    .from('users')
    .select('total_spins')
    .eq('id', userId)
    .single()

  return user?.total_spins || 0
}