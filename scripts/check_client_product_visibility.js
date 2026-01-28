require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL in env');
  process.exit(1);
}

const anon = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const admin = SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } }) : null;

async function primaryFetch() {
  try {
    const client = anon || admin;
    const { data, error } = await client.from('products').select('id,title,is_available,is_hidden,is_deleted').eq('is_sold', false).eq('is_hidden', false).eq('is_deleted', false).or('is_available.eq.true,is_available.is.null').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.warn('Primary fetch error:', error.message || error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('Primary fetch threw', e.message || e);
    return [];
  }
}

async function viewFetch() {
  if (!admin) return [];
  try {
    const { data, error } = await admin.from('active_products_view').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.warn('active_products_view fetch error:', error.message || error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('active_products_view threw', e.message || e);
    return [];
  }
}

async function rawFetch() {
  try {
    const client = anon || admin;
    const { data, error } = await client.from('products').select('id,title,is_available,is_hidden,is_deleted').order('created_at', { ascending: false }).limit(100);
    if (error) {
      console.warn('Raw fetch error:', error.message || error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('Raw fetch threw', e.message || e);
    return [];
  }
}

(async () => {
  console.log('Running client-side visibility checks...');
  const pri = await primaryFetch();
  console.log('Primary fetch count:', pri.length, pri.slice(0,5));
  const raw = await rawFetch();
  console.log('Raw fetch count:', raw.length, raw.slice(0,5));
  const view = await viewFetch();
  console.log('active_products_view count (admin only):', view.length, (view || []).slice(0,5));

  if ((pri.length === 0 || pri.length < raw.length) && raw.length > 0) {
    console.warn('Discrepancy: primary returns fewer rows than raw; this may indicate filters/joins/RLS blocking certain rows from the public query.');
  }

  if (view && view.length > 0 && (pri.length === 0 || view.length > pri.length)) {
    console.warn('active_products_view contains rows not present in primary fetch; inspect view definition and RLS policies.');
  }

  if (pri.length === 0 && raw.length === 0 && view.length === 0) {
    console.info('No products visible to anon/admin queries.')
  }

  console.log('Done.');
})();