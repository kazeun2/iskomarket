/*
 * Run: node scripts/verify_products_fk.js
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key);

async function run() {
  // Query pg_constraint for products -> users foreign key
  const sql = `SELECT
    c.conname as constraint_name,
    c.conrelid::regclass::text as table_name,
    pg_catalog.pg_get_constraintdef(c.oid, true) as definition,
    c.confdeltype
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE c.contype = 'f'
    AND t.relname = 'products'
    AND (SELECT relname FROM pg_class WHERE oid = c.confrelid) = 'users';`;

  let data, error;
  try {
    const res = await admin.rpc('sql', { query: sql });
    data = res.data; error = res.error;
  } catch (e) {
    console.warn('admin.rpc failed or is not available:', e?.message || e);
    data = null; error = e;
  }

  // Not all projects allow rpc('sql'), so fallback via direct table read using PostgREST
  if (!data || error) {
    // Use direct read of pg_catalog via 'pg_constraint' table if available through PostgREST
    try {
      const { data: pgData, error: pgErr } = await admin.from('pg_constraint').select('conname, conrelid, oid, confdeltype').limit(10);
      if (pgErr) {
        console.error('Unable to query system catalogs via REST. Please run the following SQL in Supabase SQL editor (admin):\n', sql);
        if (pgErr) console.error('Error:', pgErr);
        process.exit(1);
      }
      console.log('pg_constraint sample (limited):', pgData);
      return;
    } catch (e) {
      console.error('Could not auto-verify FK. Please run this SQL in Supabase SQL editor (admin):\n', sql);
      console.error(e);
      return;
    }
  }

  console.log('FK verification result:', data);
  for (const row of data) {
    console.log(`- ${row.constraint_name}: def=${row.definition} confdeltype='${row.confdeltype}' (r = RESTRICT, c = CASCADE)`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
