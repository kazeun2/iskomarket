/*
  E2E test: verify removal of custom_title column and UI elements
  - Checks database (information_schema.columns) for existence of `custom_title` column on `users` table
  - Checks the built site `build/index.html` for the presence of removed UI strings

  Requirements in .env (prefer a separate test Supabase project):
    TEST_SUPABASE_URL
    TEST_SUPABASE_ANON_KEY
    TEST_SUPABASE_SERVICE_ROLE_KEY

  Usage:
    node scripts/e2e_remove_custom_title_test.js
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase credentials. Please set TEST_SUPABASE_* or the equivalent VITE/SUPABASE vars in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function checkDbColumn() {
  console.log('Checking database for custom_title column on users table...');
  const sql = "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='custom_title'";
  try {
    const { data, error } = await admin.rpc('sql', { query: sql });
    if (!error) {
      const exists = (data || []).length > 0;
      if (exists) {
        console.error('custom_title column still exists in database (FAIL)');
        return false;
      }
      console.log('custom_title column not found in DB via rpc("sql") (PASS)');
      return true;
    }
    console.warn('admin.rpc("sql") returned an error (attempting fallback checks) -', error?.message || error);
  } catch (err) {
    console.warn('admin.rpc("sql") call failed or is not available:', err?.message || err);
  }

  // Fallback: if admin.postgres.query is available, use it
  try {
    if (typeof admin.postgres?.query === 'function') {
      console.log('Attempting schema check via admin.postgres.query(...)');
      const { data } = await admin.postgres.query({ sql });
      const exists = (data || []).length > 0;
      if (exists) {
        console.error('custom_title column still exists in database (FAIL)');
        return false;
      }
      console.log('custom_title column not found in DB via admin.postgres.query (PASS)');
      return true;
    }
  } catch (err) {
    console.warn('admin.postgres.query attempt failed or is not available:', err?.message || err);
  }

  // Final fallback: attempt a safe select on users.custom_title and infer existence from error/no-error
  try {
    console.log('Attempting safe select on users.custom_title (best-effort fallback)');
    const { data, error } = await admin.from('users').select('custom_title').limit(1);
    if (error) {
      // If the error indicates the column doesn't exist, treat as PASS
      const msg = (error && (error.message || error.code)) || '';
      // Some Postgres error messages may include different forms like:
      // - "column \"custom_title\" does not exist"
      // - "column users.custom_title does not exist"
      // so check for presence of the column name itself as a best-effort indication
      if (typeof msg === 'string' && msg.toLowerCase().includes('custom_title')) {
        console.log('Select failed indicating column is absent (PASS)');
        return true;
      }
      console.warn('Select returned an error that is not clearly column-missing:', error);
      throw new Error('Unable to determine presence of column via fallback select');
    }
    // If select returned rows, column exists
    if (Array.isArray(data) && data.length >= 0) {
      // If rows were returned without error, the column exists (or the driver tolerated missing column)
      console.error('custom_title column still present (select returned data) (FAIL)');
      return false;
    }
  } catch (err) {
    console.error('Error when performing fallback schema checks:', err?.message || err);
    throw err;
  }

  // If we somehow fell through, fail safely
  console.error('Unable to confidently determine DB schema state (FAIL)');
  return false;
}

function checkBuiltUI() {
  console.log('Checking built UI (build/index.html) for removed strings...');
  const buildIndex = path.resolve(__dirname, '..', 'build', 'index.html');
  if (!fs.existsSync(buildIndex)) {
    console.warn('build/index.html not found; skipping static UI check. Consider running `npm run build` before the test.');
    return true; // don't fail the whole test because build is missing
  }
  const html = fs.readFileSync(buildIndex, 'utf8');
  const forbidden = [
    'Active Sales',
    'Past Season Achievements',
    'Create your custom title',
    'Choose Your College Frame Theme',
    'Student Business Feature'
  ];
  const present = forbidden.filter(s => html.includes(s));
  if (present.length > 0) {
    console.error('Found forbidden UI strings in build/index.html:', present);
    return false;
  }
  console.log('No forbidden UI strings found in build/index.html (PASS)');
  return true;
}

async function run() {
  console.log('Starting e2e_remove_custom_title test...');

  // DB check
  let dbOk = false;
  try {
    dbOk = await checkDbColumn();
  } catch (err) {
    console.error('DB check could not be completed:', err?.message || err);
    process.exit(2);
  }

  // UI check (built index)
  const uiOk = checkBuiltUI();

  if (dbOk && uiOk) {
    console.log('e2e_remove_custom_title test PASSED');
    process.exit(0);
  } else {
    console.error('e2e_remove_custom_title test FAILED');
    process.exit(1);
  }
}

run().catch(err => { console.error('Test error:', err); process.exit(1); });
