/* E2E product visibility test
   Steps:
   1. Create test user (admin)
   2. Sign in as user and create a product
   3. Fetch products as anon / another user to ensure product is visible in global feed
   4. Sign out and sign in again as owner and fetch user's products to ensure it's in "My Products"
   5. Cleanup created rows

   Requires SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY in .env
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

(async function main() {
  try {
    const email = `e2e.user+${Date.now()}@cvsu.edu.ph`;
    const password = 'TestPass123!';
    const username = `e2e_user_${Date.now()}`;

    console.log('Creating test user (admin)');
    const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, user_metadata: { username }, email_confirm: true });
    if (createErr) {
      console.error('Failed to create user:', createErr);
      process.exit(1);
    }
    const userId = created.user.id;
    console.log('Created user id:', userId);

    // Create profile row for the user (service role bypasses RLS)
    const { error: profileErr } = await admin.from('users').upsert([{ id: userId, email, username, is_active: true }], { onConflict: 'id' });
    if (profileErr) {
      console.error('Failed to upsert profile row:', profileErr);
      process.exit(1);
    }

    // Sign in as the user using anon client
    console.log('Signing in as test user');
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    if (signInErr) {
      console.error('Sign-in failed:', signInErr);
      process.exit(1);
    }

    const ownerClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    // set session in ownerClient
    ownerClient.auth.setSession(signIn.session);

    // Insert product as owner
    console.log('Inserting product as owner');
    const payload = {
      title: 'E2E Test Product',
      description: 'E2E visibility test',
      price: 1,
      category_id: null,
      condition: 'Good',
      location: 'Gate 1',
      images: [],
      is_available: true,
      is_deleted: false,
      is_hidden: false,
      seller_id: userId
    };

    const { data: prod, error: prodErr } = await ownerClient.from('products').insert(payload).select('*').single();
    if (prodErr) {
      console.error('Failed to insert product as owner:', prodErr);
      process.exit(1);
    }
    console.log('Inserted product id:', prod.id);

    // Fetch products as anon (global feed)
    console.log('Fetching products as anon (global feed)');
    const { data: anonData, error: anonErr } = await anon.from('products').select('*').eq('id', prod.id).maybeSingle();
    if (anonErr) {
      console.error('Anon select failed:', anonErr);
      process.exit(1);
    }
    console.log('Anon visibility of product:', !!anonData);

    // Sign out owner and sign in again to simulate login round-trip
    await ownerClient.auth.signOut();
    const { data: signIn2, error: signIn2Err } = await anon.auth.signInWithPassword({ email, password });
    if (signIn2Err) {
      console.error('Sign-in 2 failed:', signIn2Err);
      process.exit(1);
    }
    const ownerClient2 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    ownerClient2.auth.setSession(signIn2.session);

    // Fetch user's products (My Products)
    console.log('Fetching My Products for owner');
    const { data: myProducts, error: myErr } = await ownerClient2.from('products').select('*').eq('seller_id', userId);
    if (myErr) {
      console.error('Failed to fetch My Products:', myErr);
      process.exit(1);
    }
    console.log('Owner My Products found count:', (myProducts || []).length);

    // Cleanup: delete product and user
    console.log('Cleaning up test rows');
    await admin.from('products').delete().eq('id', prod.id);
    await admin.auth.admin.deleteUser(userId);

    console.log('E2E product visibility test completed successfully');
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error in e2e_products_visibility:', e.message || e);
    process.exit(1);
  }
})();