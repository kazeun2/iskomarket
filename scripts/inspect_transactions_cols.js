require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function run() {
  const { data, error } = await admin.from('transactions').select('*').limit(1);
  if (error) {
    console.error('Select error:', error);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log('No rows; schema keys from select might still be empty. Querying information_schema...');
    const { data: cols, error: colsErr } = await admin.rpc('sql', { q: `select column_name, data_type from information_schema.columns where table_name = 'transactions' order by ordinal_position;` }).catch(() => ({ data: null, error: true }));
    console.log('information_schema query result:', cols, colsErr);
    process.exit(0);
  }
  console.log('Sample row keys:', Object.keys(data[0]));
}

run().catch((e) => {console.error('failed:', e); process.exit(1);});
