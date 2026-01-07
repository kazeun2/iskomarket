import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { addIskoins, deductIskoins, performDailySpin, canUserSpin, setAdminClient } from '../../src/lib/services/rewards'
import { supabase } from '../../src/lib/supabase'

// Load .env file for test environment
dotenv.config()

/**
 * E2E Rewards Test Suite — Real Database
 * Tests IsKoin reward flows against the live Supabase database:
 * - addIskoins: Increase balance and log transaction
 * - deductIskoins: Decrease balance and log negative transaction
 * - performDailySpin: Award Iskoins, set cooldown, record spin
 * - canUserSpin: Verify 24-hour cooldown enforcement
 * - Reward expiry & anti-repeat protection via DB constraints
 */

describe('Rewards e2e (real database) — IsKoin redeem/spin flows', () => {
  let testUserId: string
  const testEmail = `test-rewards-${Date.now()}@example.com`
  const testUsername = `user_${Math.random().toString(36).slice(2, 11)}`
  
  // Create admin client for setup/teardown (bypasses RLS)
  const adminSupabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  beforeEach(async () => {
    // Set admin client for reward service (to bypass RLS)
    setAdminClient(adminSupabase)

    // Create a test user in the database (using admin client to bypass RLS)
    const { data: newUser, error: createError } = await adminSupabase
      .from('users')
      .insert({
        email: testEmail,
        username: testUsername,
        program: 'Test Program',
        college: 'Test College',
        iskoins: 100,
        credit_score: 70,
        rank_tier: 'Unranked',
        last_spin_date: null,
        spin_count: 0,
        total_spins: 0
      })
      .select('id')
      .single()

    if (createError) throw createError
    testUserId = newUser.id
  })

  afterEach(async () => {
    // Clean up: delete test user and their transactions/spins (using admin client)
    if (testUserId) {
      await adminSupabase.from('iskoin_transactions').delete().eq('user_id', testUserId)
      await adminSupabase.from('daily_spins').delete().eq('user_id', testUserId)
      await adminSupabase.from('users').delete().eq('id', testUserId)
    }
  })

  it('addIskoins increases balance and logs transaction', async () => {
    const initialBalance = 100
    const addAmount = 25
    const newBalance = await addIskoins(testUserId, addAmount, 'bonus', 'Test bonus')

    expect(newBalance).toBe(initialBalance + addAmount)

    // Verify transaction was logged (use admin client for read)
    const { data: txs } = await adminSupabase
      .from('iskoin_transactions')
      .select('*')
      .eq('user_id', testUserId)

    expect(txs).toBeTruthy()
    expect(txs!.length).toBeGreaterThan(0)
    const tx = txs![0]
    expect(tx.amount).toBe(addAmount)
    expect(tx.balance_after).toBe(initialBalance + addAmount)
  })

  it('deductIskoins decreases balance and logs transaction', async () => {
    const initialBalance = 100
    const deductAmount = 40
    const newBalance = await deductIskoins(testUserId, deductAmount, 'redeem', 'Redeem test')

    expect(newBalance).toBe(initialBalance - deductAmount)

    // Verify transaction was logged with negative amount
    const { data: txs } = await adminSupabase
      .from('iskoin_transactions')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })

    expect(txs).toBeTruthy()
    expect(txs!.length).toBeGreaterThan(0)
    const tx = txs![0]
    expect(tx.amount).toBe(-deductAmount)
    expect(tx.balance_after).toBe(initialBalance - deductAmount)
  })

  it('canUserSpin returns true when no spin today', async () => {
    const canSpin = await canUserSpin(testUserId)
    expect(canSpin).toBe(true)
  })

  it('performDailySpin awards Iskoins, sets cooldown, records spin', async () => {
    const initialBalance = 100
    const rewardAmount = 10

    // Perform daily spin
    const result = await performDailySpin(testUserId, rewardAmount, 'iskoin')
    expect(result.rewardAmount).toBe(rewardAmount)
    expect(result.canSpinAgain).toBe(false)

    // Verify user balance increased
    const { data: user } = await adminSupabase
      .from('users')
      .select('iskoins, last_spin_date')
      .eq('id', testUserId)
      .single()

    expect(user).toBeTruthy()
    expect(user!.iskoins).toBe(initialBalance + rewardAmount)
    expect(user!.last_spin_date).toBeTruthy()

    // Verify spin was recorded
    const { data: spins } = await adminSupabase
      .from('daily_spins')
      .select('*')
      .eq('user_id', testUserId)

    expect(spins).toBeTruthy()
    expect(spins!.length).toBe(1)
    expect(spins![0].reward_amount).toBe(rewardAmount)
  })

  it('performDailySpin rejects if user already spun today', async () => {
    // Perform first spin
    await performDailySpin(testUserId, 10, 'iskoin')

    // Try to spin again — should be rejected
    await expect(performDailySpin(testUserId, 5, 'iskoin')).rejects.toThrow('Already spun today')
  })

  it('canUserSpin returns false after spin today', async () => {
    // Perform daily spin
    await performDailySpin(testUserId, 10, 'iskoin')

    // Verify user cannot spin again today
    const canSpin = await canUserSpin(testUserId)
    expect(canSpin).toBe(false)
  })

  it('multiple add/deduct operations maintain correct balance', async () => {
    const op1 = await addIskoins(testUserId, 50, 'bonus', 'First bonus')
    expect(op1).toBe(150) // 100 + 50

    const op2 = await deductIskoins(testUserId, 30, 'redeem', 'First redeem')
    expect(op2).toBe(120) // 150 - 30

    const op3 = await addIskoins(testUserId, 20, 'earned', 'Earned reward')
    expect(op3).toBe(140) // 120 + 20

    // Verify transaction history
    const { data: txs } = await adminSupabase
      .from('iskoin_transactions')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: true })

    expect(txs).toBeTruthy()
    expect(txs!.length).toBe(3)
    expect(txs![0].balance_after).toBe(150)
    expect(txs![1].balance_after).toBe(120)
    expect(txs![2].balance_after).toBe(140)
  })
})
