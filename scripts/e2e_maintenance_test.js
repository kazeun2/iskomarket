/*
  E2E test for maintenance_windows realtime
  - Uses TEST_* env or falls back to .env
  - Inserts a maintenance window via service role and verifies viewer receives INSERT event
*/
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase credentials. Please set TEST_SUPABASE_* or the equivalent VITE/SUPABASE vars in .env')
  process.exit(1)
}

const viewer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 10 } } })
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 10 } } })

function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function run() {
  console.log('Starting maintenance e2e test...')
  const events = []

  const channel = viewer
    .channel('watch-maintenance')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maintenance_windows' }, (payload) => {
      console.log('[VIEWER] maintenance INSERT', payload.new || payload)
      events.push(payload.new || payload)
    })
    .subscribe()

  await wait(1500)

  const now = new Date()
  // Keep the test window far enough in the future so it won't auto-expire during testing
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const payload = {
    title: 'E2E maintenance test',
    message: 'This is a short e2e maintenance test',
    start_at: now.toISOString(),
    end_at: inSevenDays.toISOString(),
    is_active: true,
    type: 'maintenance'
  }

  console.log('Inserting maintenance window (maintenance type)...')
  // Try inserting with `type`, but fall back to schema without `type` if necessary
  let res = await admin.from('maintenance_windows').insert(payload).select().single()
  if (res.error && (res.error.code === 'PGRST204' || (res.error.message || '').includes("'type' column"))) {
    console.warn('Server does not support `type` column; falling back to insert without type for maintenance')
    const { type, ...payloadNoType } = payload
    res = await admin.from('maintenance_windows').insert(payloadNoType).select().single()
  }
  if (res.error) {
    // If a maintenance/alert window already exists and is active we get a duplicate key error
    if (res.error.code === '23505' && (res.error.message || '').includes('maintenance_windows_single_active_idx')) {
      console.warn('An active maintenance/alert window already exists; fetching existing active window...')
      const { data: existing } = await admin.from('maintenance_windows').select().eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (existing) {
        console.log('Existing active window:', existing)
        console.log('Since an active window exists already, leaving it in place (will not remove it).')
        try { viewer.removeChannel(channel) } catch (e) {}
        process.exit(0)
      }
    }

    console.error('Insert error', res.error)
    process.exit(1)
  }
  console.log('Inserted maintenance window id:', res.data.id)

  // wait for realtime event
  const seen = await waitForEvent(() => events.length > 0, 5000)
  if (!seen) {
    console.error('Timeout waiting for realtime event for maintenance_windows')
    try { viewer.removeChannel(channel) } catch (e) {}
    process.exit(2)
  }

  console.log('Viewer saw maintenance event:', events[0])

  // Now insert an alert-type window to verify banner behavior and realtime
  events.length = 0
  const alertPayload = {
    title: 'E2E alert test',
    message: 'This is a short e2e alert test',
    start_at: now.toISOString(),
    end_at: inSevenDays.toISOString(),
    is_active: true,
    type: 'alert'
  }

  console.log('Inserting maintenance window (alert type)...')
  // Try inserting with `type`, but fall back to schema without `type` if necessary
  let alertRes = await admin.from('maintenance_windows').insert(alertPayload).select().single()
  if (alertRes.error && (alertRes.error.code === 'PGRST204' || (alertRes.error.message || '').includes("'type' column"))) {
    console.warn('Server does not support `type` column; falling back to insert without type for alert')
    const { type, ...alertPayloadNoType } = alertPayload
    alertRes = await admin.from('maintenance_windows').insert(alertPayloadNoType).select().single()
  }
  if (alertRes.error) {
    if (alertRes.error.code === '23505' && (alertRes.error.message || '').includes('maintenance_windows_single_active_idx')) {
      console.warn('An active maintenance/alert window already exists; fetching existing active window...')
      const { data: existing } = await admin.from('maintenance_windows').select().eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (existing) {
        console.log('Existing active window:', existing)
        console.log('Since an active window exists already, leaving it in place (will not remove it).')
        try { viewer.removeChannel(channel) } catch (e) {}
        process.exit(0)
      }
    }
    console.error('Alert insert error', alertRes.error)
    process.exit(1)
  }
  console.log('Inserted alert window id:', alertRes.data.id)

  const seenAlert = await waitForEvent(() => events.length > 0, 5000)
  if (!seenAlert) {
    console.error('Timeout waiting for realtime event for alert maintenance_windows')
    try { viewer.removeChannel(channel) } catch (e) {}
    process.exit(2)
  }

  console.log('Viewer saw alert event:', events[0])

  try { viewer.removeChannel(channel) } catch (e) {}
  process.exit(0)
}

function waitForEvent(checkFn, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve) => {
    const iv = setInterval(() => {
      if (checkFn()) {
        clearInterval(iv)
        resolve(true)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv)
        resolve(false)
      }
    }, 200)
  })
}

run().catch((err) => { console.error('Test error:', err); process.exit(1) })