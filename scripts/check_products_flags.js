/*
  Usage: node scripts/check_products_flags.js
  Requires environment variables:
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY (or a key with sufficient privileges for listing rows)

  This script lists products whose visibility flags would prevent public selection.
*/
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

(async function main(){
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, seller_id, is_available, is_hidden, is_deleted, created_at')
      .or('is_available.is.null,is_available.eq.false,is_hidden.eq.true,is_deleted.eq.true')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No products found with problematic visibility flags.');
      return;
    }

    console.table(data.map(p => ({
      id: p.id,
      title: p.title || '<no title>',
      seller_id: p.seller_id,
      is_available: p.is_available,
      is_hidden: p.is_hidden,
      is_deleted: p.is_deleted,
      inserted_at: p.inserted_at
    })));
    console.log('\nIf you find rows that should be visible, consider running the following SQL in Supabase SQL editor as an admin:');
    console.log("-- Backfill missing is_available to true for legacy rows\nUPDATE products SET is_available = true WHERE is_available IS NULL;\n");
  } catch (err) {
    console.error('Error checking products:', err.message || err);
    process.exit(1);
  }
})();
