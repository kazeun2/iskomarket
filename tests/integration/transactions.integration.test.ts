import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Integration test for transaction inserts under RLS
// Requires env vars set in your environment or CI:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
// These tests will be skipped if any required env var is missing.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) {
  console.warn('Skipping transactions.integration tests: missing SUPABASE env vars')
}

describe('transactions RLS integration', () => {
  let admin: any
  let anon: any
  let userA: any
  let userB: any
  let product: any

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) return
    admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
    anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

    // Create two test users via admin API
    const pw = 'TestPass123!'
    const emailA = `test.sender+${Date.now()}@cvsu.test`
    const emailB = `test.receiver+${Date.now()}@cvsu.test`

    const { data: createdA, error: errA } = await admin.auth.admin.createUser({ email: emailA, password: pw, user_metadata: { username: 'test_sender' }, email_confirm: true })
    if (errA) throw errA
    const userAId = createdA?.id || createdA?.user?.id

    const { data: createdB, error: errB } = await admin.auth.admin.createUser({ email: emailB, password: pw, user_metadata: { username: 'test_receiver' }, email_confirm: true })
    if (errB) throw errB
    const userBId = createdB?.id || createdB?.user?.id

    userA = { id: userAId, email: emailA, password: pw }
    userB = { id: userBId, email: emailB, password: pw }

    // Ensure minimal profiles exist to satisfy FKs
    await admin.from('user_profile').upsert([{ user_id: userAId }])
    await admin.from('user_profile').upsert([{ user_id: userBId }])

    // Create a product owned by userB
    const { data: prod, error: prodErr } = await admin.from('products').insert([{ seller_id: userBId, title: 'RLS Test Product', description: 'Product for transactions RLS test', price: 1.00, category: 'tests', condition: 'new' }]).select().single()
    if (prodErr) throw prodErr
    product = prod
  })

  afterAll(async () => {
    if (!admin) return
    try {
      // cleanup transactions, product, and users
      await admin.from('transactions').delete().eq('product_id', product?.id)
      if (product?.id) await admin.from('products').delete().eq('id', product.id)
      if (userA?.id) await admin.auth.admin.deleteUser(userA.id)
      if (userB?.id) await admin.auth.admin.deleteUser(userB.id)
    } catch (e) {
      console.warn('Cleanup failed:', e)
    }
  })

  it('allows authenticated sender to insert a transaction (sender_id/receiver_id preferred)', async () => {
    if (!admin || !anon) return

    // Sign in as userA
    const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({ email: userA.email, password: userA.password })
    expect(signInErr).toBeNull()
    const accessToken = signInData?.session?.access_token
    expect(accessToken).toBeTruthy()

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } })

    // Try sender/receiver then legacy buyer/seller
    const payloads = [ { sender_id: userA.id, receiver_id: userB.id, product_id: product.id }, { buyer_id: userA.id, seller_id: userB.id, product_id: product.id } ]

    let res
    for (const p of payloads) {
      const attempt = await userClient.from('transactions').insert([p]).select().single()
      if (!attempt.error) { res = attempt; break }
      // try next payload if column missing
      const m = attempt.error?.message || ''
      if (m.includes('Could not find the') || m.includes('column "sender_id"') || m.includes('column "receiver_id"')) continue
      // otherwise fail fast
      throw attempt.error
    }

    expect(res).toBeDefined()
    expect(res.data).toBeDefined()
    expect(res.error).toBeNull()
  })

  it('allows authenticated receiver to insert a counterpart transaction (no 403)', async () => {
    if (!admin || !anon) return

    // Sign in as userB
    const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({ email: userB.email, password: userB.password })
    expect(signInErr).toBeNull()
    const accessToken = signInData?.session?.access_token
    expect(accessToken).toBeTruthy()

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } })

    const payloads = [ { sender_id: userB.id, receiver_id: userA.id, product_id: product.id }, { buyer_id: userB.id, seller_id: userA.id, product_id: product.id } ]

    let res
    for (const p of payloads) {
      const attempt = await userClient.from('transactions').insert([p]).select().single()
      if (!attempt.error) { res = attempt; break }
      const m = attempt.error?.message || ''
      if (m.includes('Could not find the') || m.includes('column "sender_id"') || m.includes('column "receiver_id"')) continue
      throw attempt.error
    }

    expect(res).toBeDefined()
    expect(res.data).toBeDefined()
    expect(res.error).toBeNull()
  })
})
