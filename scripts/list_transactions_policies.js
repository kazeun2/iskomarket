require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function run() {
  // First, verify table presence and schema
  let sql = `select json_agg(t) from (select schemaname, tablename from pg_catalog.pg_tables where tablename='transactions') t;`;
  let res = await admin.rpc('sql', { query: sql });
  if (res.error) { console.error('RPC sql error:', res.error); process.exit(1); }
  console.log('Raw res (table lookup):', JSON.stringify(res.data, null, 2));
  console.log('Table lookup (nested access):', res.data?.[0]?.[0]?.json_agg ?? null);

  // Then, list policies (if any) across schemas
  sql = `select json_agg(t) from (select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_catalog.pg_policies where tablename='transactions') t;`;
  res = await admin.rpc('sql', { query: sql });
  if (res.error) { console.error('RPC sql error:', res.error); process.exit(1); }
  console.log('Raw res (policies):', JSON.stringify(res.data, null, 2));
  // Inspect nested structure; the RPC returns nested arrays
  const nested = res.data?.[0]?.[0];
  console.log('Policies nested object:', nested);
  // If nested is an object with json_agg field, print it
  if (nested && nested.json_agg) {
    console.log('Policies (json_agg):', nested.json_agg);
  } else {
    console.log('No json_agg field present; attempting to directly extract array from nested arrays.');
    const flat = res.data?.[0]?.map(x => x) ?? null;
    console.log('Flat policies array (approx):', flat);
  }
}

run().catch((e)=>{console.error(e);process.exit(1);});
