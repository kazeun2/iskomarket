#!/usr/bin/env node
/*
 * Run migration via admin.rpc('sql') by appending a final SELECT to ensure tuples are returned
 * Usage: node scripts/run_migration_wrap_select.js migrations/filename.sql
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

const admin = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  const arg = process.argv[2] || 'migrations/20260115-add-user-profile-fields.sql';
  const full = path.resolve(arg);
  if (!fs.existsSync(full)) {
    console.error('Migration file not found:', full);
    process.exit(1);
  }

  const sql = fs.readFileSync(full, 'utf8');
  // Wrap SQL and append a final select so admin.rpc('sql') receives tuples
  const wrapped = `${sql}\n\n-- Return a tuple to satisfy rpc("sql") caller\nselect 1 as __migration_applied__;`;

  console.log(`Running wrapped migration: ${path.basename(full)}`);

  try {
    const res = await admin.rpc('sql', { query: wrapped });
    if (res.error) {
      console.error('RPC sql returned error:', res.error);
      process.exit(1);
    }
    console.log('Migration executed via admin.rpc("sql"). Result sample:', Array.isArray(res.data) ? res.data.slice(0,5) : res.data);
    console.log('Migration completed successfully. Verify by inspecting tables or running tests.');
  } catch (e) {
    console.warn('admin.rpc("sql") failed or is not allowed in this project:', e?.message || e);
    console.error('Please run the SQL manually in the Supabase SQL editor (admin) using the following file:', full);
    process.exit(1);
  }
}

run().catch(e => { console.error(e); process.exit(1); });