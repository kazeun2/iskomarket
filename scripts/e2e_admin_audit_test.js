/*
  End-to-end admin_audit_logs realtime test
  - Uses a separate test Supabase project (TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY) for the viewer client
  - Uses a service role key (TEST_SUPABASE_SERVICE_ROLE_KEY) for inserting an admin audit row (bypasses RLS)
  - Subscribes as viewer to INSERTs on `admin_audit_logs` and verifies the INSERT is observed

  Requirements in .env (prefer a separate test DB/project):
    TEST_SUPABASE_URL
    TEST_SUPABASE_ANON_KEY
    TEST_SUPABASE_SERVICE_ROLE_KEY

  Usage:
    # create .env.test with the TEST_* vars and run:
    node scripts/e2e_admin_audit_test.js
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const usingTestEnv = Boolean(process.env.TEST_SUPABASE_URL || process.env.TEST_SUPABASE_ANON_KEY || process.env.TEST_SUPABASE_SERVICE_ROLE_KEY);
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase credentials. Please set TEST_SUPABASE_* or the equivalent VITE/SUPABASE vars in .env');
  process.exit(1);
}
if (!usingTestEnv) {
  console.warn('Warning: Running e2e admin-audit test using non-TEST env variables (e.g. VITE_SUPABASE_* or SUPABASE_SERVICE_ROLE_KEY). Ensure this targets a dedicated test DB.');
}

const viewer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 10 } } });
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 10 } } });

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function insertWithRetry(client, table, payload, attempts = 6) {
  let i = 0;
  let lastErr = null;
  while (i < attempts) {
    const { data, error } = await client.from(table).insert(payload).select('*').single();
    if (!error) return { data, error: null };
    lastErr = error;
    const msg = (error.message || '').toLowerCase();
    if (error.code === 'PGRST204' || msg.includes('schema cache') || msg.includes('could not find')) {
      const backoff = 500 * Math.pow(2, i);
      console.warn(`Transient schema-cache error on insert to ${table}, retrying in ${backoff}ms (attempt ${i+1}/${attempts})`, error.message || error);
      await wait(backoff);
      i++;
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: lastErr };
}

function waitForEvent(checkFn, timeoutMs) {
  const start = Date.now();
  return new Promise(resolve => {
    const iv = setInterval(() => {
      if (checkFn()) {
        clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        resolve(false);
      }
    }, 200);
  });
}

async function run() {
  console.log('Starting admin_audit_logs E2E test (test DB) ...');

  // Best-effort: ensure the table is part of the realtime publication so INSERTs are broadcast
  try {
    console.log('Attempting to add admin_audit_logs to replication publication via admin.rpc("sql") (this may fail if rpc is not enabled)');
    const { data: rpcData, error: rpcErr } = await admin.rpc('sql', { query: "ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;" });
    if (rpcErr) {
      console.warn('admin.rpc("sql") returned an error (this is non-fatal):', rpcErr.message || rpcErr);
    } else {
      console.log('admin.rpc("sql") executed; publication updated (response):', rpcData);
      // give replication a moment to catch up
      await wait(1500);
    }
  } catch (err) {
    console.warn('Unable to run admin.rpc("sql") - skipping publication update:', err?.message || err);
  }

  const events = [];

  const channel = viewer
    .channel('watch-admin-audit-logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_logs' }, payload => {
      console.log('[VIEWER] admin_audit_logs INSERT', payload.new || payload);
      events.push(payload.new || payload);
    })
    .subscribe();

  // give subscriptions a moment to establish
  await wait(2000);

  const payload = {
    admin_email: `e2e@local.test`,
    action: 'deleted',
    target_type: 'product',
    target_id: `e2e-product-${Date.now()}`,
    target_title: 'E2E test product',
    reason: 'e2e test insertion',
    metadata: { source: 'e2e' }
  };

  console.log('Inserting admin audit row via service role...');
  const { data, error } = await insertWithRetry(admin, 'admin_audit_logs', payload);
  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }
  console.log('Inserted admin audit row id:', data?.id);

  // Diagnostic: can the anon/viewer SELECT from admin_audit_logs? (RLS may block reads)
  try {
    const { data: viewerRows, error: viewerError } = await viewer
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (viewerError) {
      console.warn('Viewer SELECT error on admin_audit_logs:', viewerError.message || viewerError);
    } else {
      console.log('Viewer SELECT returned rows (latest):', (viewerRows || []).slice(0,3).map(r => ({ id: r.id, action: r.action })));
    }
  } catch (err) {
    console.warn('Unexpected error when viewer attempted SELECT on admin_audit_logs:', err);
  }

  const seen = await waitForEvent(() => events.length > 0, 5000);
  if (!seen) {
    console.error('Timeout waiting for realtime event (did not see admin_audit_logs insert via viewer subscription)');
    try { viewer.removeChannel(channel); } catch (e) {}
    process.exit(2);
  }

  console.log('Realtime admin_audit_logs event received by viewer:', events[0]);

  // Cleanup: try to remove channel
  try {
    await viewer.removeChannel(channel);
  } catch (err) {
    // older supabase-js may not support removeChannel
  }

  console.log('admin_audit_logs E2E test completed successfully');
  process.exit(0);
}

run().catch(err => { console.error('Test error:', err); process.exit(1); });
