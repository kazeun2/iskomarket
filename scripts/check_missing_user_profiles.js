/*
 * Run: node scripts/check_missing_user_profiles.js
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment for reliable access.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('seller_id')
    .not('seller_id', 'is', null);

  if (error) {
    console.error('Failed to query products:', error);
    process.exit(1);
  }

  // Deduplicate seller ids client-side (avoid DB-specific DISTINCT syntax)
  const sellerIds = Array.from(new Set((data || []).map(r => r.seller_id)));
  if (sellerIds.length === 0) {
    console.log('No products with seller_id found.');
    return;
  }

  const { data: missing, error: missingErr } = await supabase.rpc('array_missing_users', { uids: sellerIds });

  if (missingErr) {
    // fallback: do manual check
    console.warn('RPC array_missing_users not available, falling back to per-id check');
    const stillMissing = [];
    for (const id of sellerIds) {
      const { data: profile } = await supabase.from('users').select('id').eq('id', id).maybeSingle();
      if (!profile) stillMissing.push(id);
    }
    console.log('Missing user profiles:', stillMissing.length);
    if (stillMissing.length) console.log(stillMissing.slice(0, 50));
    return;
  }

  console.log('Missing user profiles:', missing);
}

run().catch(e => { console.error(e); process.exit(1); });
