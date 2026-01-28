#!/usr/bin/env node
/*
 * Run: node scripts/run_migration.js migrations/20251216-fix-messages-schema.sql
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment (.env supported)
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const admin = createClient(url, key);

async function run() {
  const arg = process.argv[2] || 'migrations/20251216-fix-messages-schema.sql';
  const full = path.resolve(arg);
  if (!fs.existsSync(full)) {
    console.error('Migration file not found:', full);
    process.exit(1);
  }

  const sql = fs.readFileSync(full, 'utf8');

  console.log(`Running migration: ${path.basename(full)}`);

  try {
    const res = await admin.rpc('sql', { query: sql });
    if (res.error) {
      console.error('RPC sql returned error:', res.error);
      process.exit(1);
    }
    console.log('Migration executed via admin.rpc("sql"). Result sample:', Array.isArray(res.data) ? res.data.slice(0,5) : res.data);
    console.log('Migration completed successfully. Verify by inspecting messages/conversations or running the tests.');
  } catch (e) {
    console.warn('admin.rpc("sql") failed or is not allowed in this project:', e?.message || e);
    console.error('Please run the SQL manually in the Supabase SQL editor (admin) using the following file:', full);
    process.exit(1);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
