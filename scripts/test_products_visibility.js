/*
  Test script for product visibility & realtime behavior.
  Usage: add environment variables below or in a .env file and run with `node scripts/test_products_visibility.js`.

  Required env vars:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY

  Optional test account credentials (for sign-in tests):
    - TEST_POSTER_EMAIL
    - TEST_POSTER_PASSWORD
    - TEST_VIEWER_EMAIL
    - TEST_VIEWER_PASSWORD
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in env');
  process.exit(1);
}

const anonClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

async function fetchAsAnon() {
  if (!anonClient) {
    console.warn('No anon key provided; attempting admin (service role) fallback if available');
    if (!SERVICE_ROLE) return null;
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: adminData, error: adminErr } = await adminClient.from('products').select('*').order('created_at', { ascending: false }).limit(20);
    if (adminErr) {
      console.error('Admin select error:', adminErr);
      return null;
    }
    console.log(`Admin fetched ${adminData.length} products (latest ids):`, adminData.slice(0,5).map(p => ({id:p.id, seller_id:p.seller_id, is_available:p.is_available, is_deleted:p.is_deleted, is_hidden:p.is_hidden})));
    return adminData;
  }

  const { data, error } = await anonClient.from('products').select('*').order('created_at', { ascending: false }).limit(20);
  if (error) {
    console.error('Anon select error:', error);
    // If anon key invalid, try admin fallback
    if (error && error.message && error.message.includes('Invalid API key') && SERVICE_ROLE) {
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
      const { data: adminData, error: adminErr } = await adminClient.from('products').select('*').order('created_at', { ascending: false }).limit(20);
      if (adminErr) {
        console.error('Admin select error:', adminErr);
        return null;
      }
      console.log(`Admin fetched ${adminData.length} products (anon invalid):`, adminData.slice(0,5).map(p => ({id:p.id, seller_id:p.seller_id, is_available:p.is_available, is_deleted:p.is_deleted, is_hidden:p.is_hidden})));
      return adminData;
    }
    return null;
  }
  console.log(`Anon fetched ${data.length} products (latest ids):`, data.slice(0,5).map(p => ({id:p.id, seller_id:p.seller_id, is_available:p.is_available, is_deleted:p.is_deleted, is_hidden:p.is_hidden})));
  return data;
}

async function signInClient(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Sign-in error for', email, error);
    return null;
  }
  const userId = data?.user?.id;
  console.log('Signed in as', email, 'user id:', userId);
  return { client, userId };
}

async function createTestProduct(client, userId, title) {
  // Attempt to create a visible product via signed-in client
  const payload = {
    title,
    description: 'Test product created by visibility test script',
    price: 1,
    category_id: null,
    condition: 'Good',
    location: 'Test Location',
    images: [],
    is_available: true,
    is_deleted: false,
    is_hidden: false,
    seller_id: userId
  };

  const { data, error } = await client.from('products').insert(payload).select('*').single();
  if (error) {
    console.error('Insert error:', error);
    return null;
  }
  console.log('Inserted product id:', data.id, 'seller_id:', data.seller_id);
  return data;
}

(async () => {
  console.log('--- Anon fetch before any actions ---');
  await fetchAsAnon();

  const posterEmail = process.env.TEST_POSTER_EMAIL;
  const posterPassword = process.env.TEST_POSTER_PASSWORD;

  if (posterEmail && posterPassword) {
    console.log('Signing in as poster:', posterEmail);
    const poster = await signInClient(posterEmail, posterPassword);
    if (poster) {
      const { client: posterClient, userId } = poster;
      const product = await createTestProduct(posterClient, userId, `visibility-test-${Date.now()}`);
      if (product) {
        console.log('--- Anon fetch after insert ---');
        await fetchAsAnon();
      }
    } else if (SERVICE_ROLE) {
      console.warn('Poster sign-in failed; using admin (service role) fallback to create test user and product. This bypasses RLS checks.');
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
      // Create a user via admin API
      try {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({ email: posterEmail, password: posterPassword, user_metadata: { username: 'testposter' }, email_confirm: true });
        if (createErr && createErr.statusCode !== 409) {
          console.error('Failed to create poster via admin:', createErr);
        }
        let posterId = created?.user?.id || (created && created.id) || null;
        if (!posterId) {
          console.warn('Could not determine poster id from admin create; attempting to lookup by email');
          const { data: userRows, error: selErr } = await admin.from('users').select('id').eq('email', posterEmail).limit(1).maybeSingle();
          if (selErr) console.error('Lookup by email failed:', selErr);
          posterId = userRows?.id || null;
        }
        if (!posterId) {
          // Try to select a seller_id from existing products as a last-resort fallback
          try {
            const { data: someSeller, error: someErr } = await admin.from('products').select('seller_id').limit(1).maybeSingle();
            if (!posterId && someSeller && someSeller.seller_id) {
              posterId = someSeller.seller_id;
              console.warn('Using existing seller_id from products table as fallback:', posterId);
            }
          } catch (e) {
            console.warn('Fallback lookup for seller_id failed:', e.message || e);
          }
        }

        if (posterId) {
          const { data: prod, error: prodErr } = await admin.from('products').insert([{ title: `visibility-test-${Date.now()}`, description: 'Test product created by visibility test script (admin)', price: 1, seller_id: posterId, condition: 'Good', location: 'Test Location', images: [], is_available: true, is_deleted: false, is_hidden: false }]).select('*').single();
          if (prodErr) {
            console.error('Admin insert failed:', prodErr);
          } else {
            console.log('Admin inserted product id:', prod.id);
            console.log('--- Anon/admin fetch after insert ---');
            await fetchAsAnon();
          }
        } else {
          console.error('Could not create or resolve poster user id; skipping admin insert.');
        }
      } catch (e) {
        console.error('Admin fallback failed:', e);
      }
    }
  } else {
    console.log('No TEST_POSTER_EMAIL provided; skipping signed-in insert test. Provide env vars to run this test.');
  }

  console.log('Done.');
})();
