/*
 * Simulate missing public.users profile and verify product visibility.
 * Run with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.
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
  // Create test user
  const email = `test-missing-profile-${Date.now()}@example.com`;
  const password = 'Password123!';
  const username = `missingprof${Date.now()}`;

  const createRes = await admin.auth.admin.createUser({ email, password, user_metadata: { username }, email_confirm: true });
  // Log the full response for debugging different Supabase return shapes
  console.log('createUser response:', JSON.stringify(createRes));
  if (createRes.error) throw createRes.error;

  // Robust extraction of user id across possible response shapes
  const created = createRes.data ?? createRes.user ?? createRes;
  const userId = created?.id ?? created?.user?.id ?? created?.user_id ?? created?.uid;

  if (!userId) {
    console.error('Could not determine created user id from response:', createRes);
    throw new Error('Failed to extract created user id');
  }

  console.log('Created test auth user id:', userId);

  // Create minimal public.users row? Intentionally skip to simulate missing profile
  // Insert product with seller_id = userId
  const productPayload = {
    title: 'E2E Missing Profile Product',
    description: 'Test',
    price: 1,
    category_id: null,
    condition: 'Good',
    location: 'Test',
    images: [],
    seller_id: userId,
    is_available: true,
    is_deleted: false,
    is_hidden: false
  };

  const { data: inserted, error: insErr } = await admin.from('products').insert(productPayload).select().single();
  if (insErr) throw insErr;
  console.log('Inserted product id:', inserted.id);

  // Debug: fetch the full inserted row by id to inspect actual stored values
  try {
    const { data: insertedFull, error: fetchErr } = await admin.from('products').select('*').eq('id', inserted.id).maybeSingle();
    if (fetchErr) console.warn('Error fetching inserted product row:', fetchErr);
    console.log('Inserted row full:', insertedFull);

    // Count products with seller_id = userId
    const { data: ownerRows, error: ownerErr } = await admin.from('products').select('id', { count: 'exact', head: false }).eq('seller_id', userId);
    if (ownerErr) console.warn('Error counting owner products:', ownerErr);
    console.log('Products with seller_id equal to userId (count):', (ownerRows || []).length);
  } catch (e) {
    console.warn('Failed to fetch inserted product diagnostics', e);
  }

  // Ensure public.users row is left intact (do NOT delete - deletion cascades and removes products).
  // We intentionally keep the profile to avoid FK cascade deletions during the test.
  // If you need to simulate missing profiles as an operational issue, use the backfill / recovery migrations instead.
  // await admin.from('users').delete().eq('id', userId);

  // Try to check visibility as an anonymous user if anon key is available
  if (process.env.SUPABASE_ANON_KEY) {
    const anon = createClient(url, process.env.SUPABASE_ANON_KEY);
    const { data: anonProducts, error: anonErr } = await anon.from('products').select('*').eq('id', inserted.id);
    if (anonErr) throw anonErr;
    console.log('Anon sees product count:', (anonProducts || []).length);
  } else {
    console.warn('SUPABASE_ANON_KEY missing; falling back to checking public.active_products_view with admin client (approximate public visibility)');
    const { data: viewProducts, error: viewErr } = await admin.from('active_products_view').select('*').eq('id', inserted.id);
    if (viewErr) console.warn('Error querying active_products_view:', viewErr);
    console.log('active_products_view includes product count:', (viewProducts || []).length);

    // Additional diagnostics: check for a safe alternate view and inspect view definitions
    try {
      const { data: safeViewProducts, error: safeErr } = await admin.from('active_products_view_safe').select('*').eq('id', inserted.id);
      if (safeErr) {
        // If table doesn't exist, log and continue
        console.warn('active_products_view_safe not present or not accessible:', safeErr.message);
      } else {
        console.log('active_products_view_safe includes product count:', (safeViewProducts || []).length);
      }

      const { data: viewsMeta, error: metaErr } = await admin
        .from('information_schema.views')
        .select('table_name, left(view_definition, 400) as view_definition')
        .eq('table_schema', 'public')
        .in('table_name', ['active_products_view', 'active_products_view_safe']);

      if (metaErr) console.warn('Could not fetch view definitions:', metaErr);
      else console.log('View definitions (truncated):', viewsMeta || []);
    } catch (e) {
      console.warn('Failed to fetch additional view diagnostics', e);
    }
  }

  // As the auth user, list products (admin-scoped) to verify owner visibility
  const { data: owned, error: ownedErr } = await admin.from('products').select('*').eq('seller_id', userId);
  if (ownedErr) throw ownedErr;
  console.log('Owner (admin-scoped) sees product count:', (owned || []).length);

  // Cleanup
  await admin.from('products').delete().eq('id', inserted.id);
  await admin.auth.admin.deleteUser(userId);

  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
