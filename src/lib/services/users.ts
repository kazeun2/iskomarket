/**
 * User Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'

export interface UserProfile {
  id: string
  email: string
  username: string
  program: string
  bio: string | null
  avatar_url: string | null
  credit_score: number
  iskoins: number
  rating: number
  total_ratings: number
  successful_purchases: number
  successful_sales: number
  violations: number
  suspension_count: number
  is_admin: boolean
  is_suspended: boolean
  suspension_expires_at: string | null
  messaging_banned: boolean
  messaging_ban_expires_at: string | null
  last_active_at: string
  inactive_days: number
  products_hidden: boolean
  account_deletion_scheduled: boolean
  deletion_scheduled_at: string | null
  has_received_first_time_bonus: boolean
  last_100_credit_check_date: string | null
  days_at_100_credit: number
  created_at: string
  updated_at: string
}

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as UserProfile
}

// Get user by username
export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error) throw error
  return data as UserProfile
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}

// Update Iskoins
export async function updateIskoins(
  userId: string, 
  amount: number, 
  operation: 'add' | 'subtract',
  reason: string,
  type: 'earned' | 'spent' | 'bonus' | 'spin' | 'redeem' | 'season_lock'
) {
  const { data: user } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const newAmount = operation === 'add'
    ? user.iskoins + amount
    : Math.max(0, user.iskoins - amount)

  // Update user iskoins
  const updated = await updateUserProfile(userId, { iskoins: newAmount })

  // Log transaction
  await supabase
    .from('iskoin_transactions')
    .insert({
      user_id: userId,
      amount: operation === 'add' ? amount : -amount,
      type,
      reason
    })

  return updated
}

// Update Credit Score
export async function updateCreditScore(
  userId: string, 
  change: number, 
  reason: string,
  actionType: 'increase' | 'decrease' | 'season_reset',
  transactionId?: string
) {
  const { data: user } = await supabase
    .from('users')
    .select('credit_score')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const previousScore = user.credit_score
  const newScore = Math.max(0, Math.min(100, user.credit_score + change))

  // Update user credit score
  const updated = await updateUserProfile(userId, { credit_score: newScore })

  // Log credit score change
  await supabase
    .from('credit_score_history')
    .insert({
      user_id: userId,
      previous_score: previousScore,
      new_score: newScore,
      change_amount: change,
      reason,
      action_type: actionType,
      transaction_id: transactionId || null
    })

  return updated
}

// Get top rated users
export async function getTopRatedUsers(limit: number = 5) {
  const { data, error } = await supabase
    .from('top_rated_users')
    .select('*')
    .limit(limit)

  if (error) throw error
  return data
}

// Update last active timestamp
export async function updateLastActive(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_active_at: new Date().toISOString(),
      inactive_days: 0
    })
    .eq('id', userId)

  if (error) throw error
}

// Get user's transaction count
export async function getUserTransactionCount(userId: string) {
  const { data: purchases } = await supabase
    .from('transactions')
    .select('id', { count: 'exact' })
    // support both legacy buyer_id and canonical sender_id
    .or(`sender_id.eq.${userId},buyer_id.eq.${userId}`)
    .eq('status', 'completed')

  const { data: sales } = await supabase
    .from('transactions')
    .select('id', { count: 'exact' })
    // support both legacy seller_id and canonical receiver_id
    .or(`receiver_id.eq.${userId},seller_id.eq.${userId}`)
    .eq('status', 'completed')

  return {
    purchases: purchases?.length || 0,
    sales: sales?.length || 0,
    total: (purchases?.length || 0) + (sales?.length || 0)
  }
}

// Get user's reviews
export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviewer_id(id, username, avatar_url),
      product:products(id, title)
    `)
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Check if user can be reviewed
export async function canReviewUser(reviewerId: string, reviewedUserId: string, productId?: string) {
  // Check if reviewer has completed a transaction with reviewed user
  const { data: transaction } = await supabase
    .from('transactions')
    .select('id')
    // match either legacy buyer/seller or sender/receiver columns
    .or(`sender_id.eq.${reviewerId},buyer_id.eq.${reviewerId}`)
    .or(`receiver_id.eq.${reviewedUserId},seller_id.eq.${reviewedUserId}`)
    .eq('status', 'completed')
    .limit(1)
    .single()

  if (!transaction) return false

  // Check if already reviewed
  let query = supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('reviewed_user_id', reviewedUserId)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data: existingReview } = await query.single()

  return !existingReview
}

// Submit review
export async function submitReview(
  reviewerId: string, 
  reviewedUserId: string, 
  rating: number, 
  comment: string | null,
  productId?: string
) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment,
      product_id: productId || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ========================================
// ISKOIN BONUS SYSTEM
// ========================================

/**
 * Check and award first-time 100 credit score bonus
 * Awards 10 Iskoins when a student reaches 100 credit score for the first time this season
 * @param userId - User ID to check
 * @returns Object with bonus awarded status and amount
 */
export async function checkAndAwardFirstTimeBonus(userId: string): Promise<{
  awarded: boolean
  amount: number
  message: string
}> {
  try {
    // Get user profile
    const user = await getUserProfile(userId)

    // Admin accounts don't get first-time bonus
    if (user.is_admin) {
      return { awarded: false, amount: 0, message: 'Admin accounts do not receive first-time bonus' }
    }

    // Check if user has reached 100 credit score
    if (user.credit_score < 100) {
      return { awarded: false, amount: 0, message: 'Credit score below 100' }
    }

    // Check if user has already received the first-time bonus
    if (user.has_received_first_time_bonus) {
      return { awarded: false, amount: 0, message: 'First-time bonus already received' }
    }

    // Award 10 Iskoins for first-time 100 credit score achievement
    const bonusAmount = 10
    await updateIskoins(
      userId,
      bonusAmount,
      'add',
      'First time reaching 100 credit score this season!',
      'bonus'
    )

    // Mark that user has received the first-time bonus
    await updateUserProfile(userId, {
      has_received_first_time_bonus: true,
      last_100_credit_check_date: new Date().toISOString(),
      days_at_100_credit: 0
    })

    return {
      awarded: true,
      amount: bonusAmount,
      message: `Congratulations! You earned ${bonusAmount} Iskoins for reaching 100 credit score for the first time this season!`
    }
  } catch (error) {
    console.error('Error awarding first-time bonus:', error)
    return { awarded: false, amount: 0, message: 'Error awarding bonus' }
  }
}

/**
 * Check and award weekly maintenance bonus
 * Awards 1 Iskoin for each week maintaining 100 credit score
 * @param userId - User ID to check
 * @returns Object with bonus awarded status and amount
 */
export async function checkAndAwardWeeklyMaintenanceBonus(userId: string): Promise<{
  awarded: boolean
  amount: number
  message: string
}> {
  try {
    // Get user profile
    const user = await getUserProfile(userId)

    // Check if user currently has 100 credit score
    if (user.credit_score < 100) {
      // Reset days counter if below 100
      if (user.days_at_100_credit > 0) {
        await updateUserProfile(userId, {
          days_at_100_credit: 0,
          last_100_credit_check_date: new Date().toISOString()
        })
      }
      return { awarded: false, amount: 0, message: 'Credit score below 100' }
    }

    const now = new Date()
    const lastCheckDate = user.last_100_credit_check_date 
      ? new Date(user.last_100_credit_check_date)
      : null

    // If this is the first check, initialize the tracking
    if (!lastCheckDate) {
      await updateUserProfile(userId, {
        last_100_credit_check_date: now.toISOString(),
        days_at_100_credit: 0
      })
      return { awarded: false, amount: 0, message: 'Started tracking days at 100' }
    }

    // Calculate days since last check
    const daysSinceLastCheck = Math.floor((now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // If checked today already, skip
    if (daysSinceLastCheck < 1) {
      return { awarded: false, amount: 0, message: 'Already checked today' }
    }

    // Increment days at 100 credit
    const newDaysAt100 = user.days_at_100_credit + daysSinceLastCheck

    // Check if user has completed a full week (7 days)
    const weeksCompleted = Math.floor(newDaysAt100 / 7)
    const previousWeeksCompleted = Math.floor(user.days_at_100_credit / 7)
    const newWeeksEarned = weeksCompleted - previousWeeksCompleted

    // Update days counter
    await updateUserProfile(userId, {
      last_100_credit_check_date: now.toISOString(),
      days_at_100_credit: newDaysAt100
    })

    // Award Iskoins for completed weeks
    if (newWeeksEarned > 0) {
      const bonusAmount = newWeeksEarned // 1 Iskoin per week
      await updateIskoins(
        userId,
        bonusAmount,
        'add',
        `Maintained 100 credit score for ${newWeeksEarned} week(s)!`,
        'earned'
      )

      return {
        awarded: true,
        amount: bonusAmount,
        message: `You earned ${bonusAmount} Iskoin(s) for maintaining 100 credit score for ${newWeeksEarned} week(s)!`
      }
    }

    return {
      awarded: false,
      amount: 0,
      message: `Days at 100: ${newDaysAt100}/7 for next Iskoin`
    }
  } catch (error) {
    console.error('Error checking weekly maintenance bonus:', error)
    return { awarded: false, amount: 0, message: 'Error checking bonus' }
  }
}

/**
 * Process all Iskoin bonuses for a user
 * Checks both first-time and weekly maintenance bonuses
 * @param userId - User ID to process
 * @returns Combined result of all bonus checks
 */
export async function processIskoinBonuses(userId: string): Promise<{
  firstTimeBonus: { awarded: boolean; amount: number; message: string }
  weeklyBonus: { awarded: boolean; amount: number; message: string }
  totalAwarded: number
}> {
  // Check first-time bonus
  const firstTimeBonus = await checkAndAwardFirstTimeBonus(userId)

  // Check weekly maintenance bonus
  const weeklyBonus = await checkAndAwardWeeklyMaintenanceBonus(userId)

  const totalAwarded = firstTimeBonus.amount + weeklyBonus.amount

  return {
    firstTimeBonus,
    weeklyBonus,
    totalAwarded
  }
}

/**
 * Reset first-time bonus flag for new season
 * Called when a new season starts
 * @param userId - User ID to reset
 */
export async function resetSeasonBonusFlags(userId: string): Promise<void> {
  await updateUserProfile(userId, {
    has_received_first_time_bonus: false,
    days_at_100_credit: 0,
    last_100_credit_check_date: null
  })
}