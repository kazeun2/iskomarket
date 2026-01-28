/*
  Script to validate real-time message delivery for receiver
  - Creates buyer / seller users
  - Creates a product and a conversation
  - Subscribes as receiver to INSERT events for messages
  - Inserts a message as sender and verifies receiver receives it

  Requires env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error('Missing env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, ANON, { realtime: { params: { eventsPerSecond: 25 } } });
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 25 } } });

async function ensureUser(email) {
  const { data: created, error } = await admin.auth.admin.createUser({ email, password: 'TestPass123!', user_metadata: { test: true }, email_confirm: true }).catch(() => ({}));
  if (error && error.statusCode !== 409) throw error;
  if (created) return created.user.id || created.id || created.user;

  const { data: userRow } = await admin.from('users').select('id').eq('email', email).limit(1).maybeSingle();
  return userRow.id;
}

async function run() {
  const buyerEmail = `test.buyer+${Date.now()}@cvsu.edu.ph`;
  const sellerEmail = `test.seller+${Date.now()}@cvsu.edu.ph`;

  console.log('Creating users...');
  const buyerId = await ensureUser(buyerEmail);
  const sellerId = await ensureUser(sellerEmail);
  console.log('Buyer / Seller', buyerId, sellerId);

  // Create product
  const prodRes = await admin.from('products').insert({ title: 'E2E sub product', description: 'E2E product description', price: 1, seller_id: sellerId, category_id: null, condition: 'Good', location: 'Test Location', images: [], is_available: true, is_deleted: false, is_hidden: false }).select('id').single();
  if (prodRes.error) { console.error('Product insert error:', prodRes.error); process.exit(1); }
  const prod = prodRes.data;
  console.log('Product id:', prod?.id);

  // Create conversation
  const { data: conv } = await admin.from('conversations').insert({ product_id: prod.id, buyer_id: buyerId, seller_id: sellerId }).select('id').single();
  console.log('Conversation id:', conv.id);

  // Subscribe as receiver (seller) to messages where receiver_id equals sellerId
  console.log('Setting up receiver subscription for seller (seller must be signed-in for RLS)');
  const events = [];

  // Sign in seller client so subscription uses seller session (RLS will allow messages)
  const sellerClient = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 25 } } });
  const { data: signData, error: signErr } = await sellerClient.auth.signInWithPassword({ email: sellerEmail, password: 'TestPass123!' });
  if (signErr) {
    console.error('Seller sign-in failed:', signErr);
    process.exit(1);
  }
  console.log('Seller signed in (session user id):', signData?.user?.id || 'unknown');

  // Create authenticated subscription channel for seller
  const ch = sellerClient.channel('test-receiver')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${sellerId}` }, payload => {
      console.log('Receiver got message event:', payload.new ? { id: payload.new.id, conversation_id: payload.new.conversation_id, sender_id: payload.new.sender_id } : payload);
      events.push(payload.new || payload);
    })
    .subscribe();

  console.log('Waiting for subscription to warm up...');
  // Wait for subscription to be established
  await new Promise(r => setTimeout(r, 5000));
  console.log('Continuing after subscription warm-up');

  // Insert message as buyer
  console.log('Inserting message as buyer...');
  const { data: inserted, error: insertErr } = await admin.from('messages').insert({ conversation_id: conv.id, sender_id: buyerId, receiver_id: sellerId, message_text: 'Hello from e2e test', is_read: false }).select('*').single();
  if (insertErr) {
    console.error('Insert error:', insertErr);
    process.exit(1);
  }

  console.log('Inserted message id:', inserted.id, 'receiver_id:', inserted.receiver_id);

  // Fetch the message to verify DB state
  const { data: fetchedMsg, error: fetchErr } = await admin.from('messages').select('*').eq('id', inserted.id).maybeSingle();
  if (fetchErr) console.warn('Failed to fetch inserted message:', fetchErr);
  console.log('Fetched message row:', fetchedMsg);
  // Wait for event
  const got = await new Promise(resolve => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (events.length > 0) { clearInterval(iv); resolve(true); }
      else if (Date.now() - t0 > 5000) { clearInterval(iv); resolve(false); }
    }, 200);
  });

  console.log('Receiver saw event:', got, 'events:', events.length);

  // Cleanup
  try { await anon.removeChannel(ch); } catch (e) {}
  process.exit(got ? 0 : 2);
}

run().catch(e => { console.error('Test failed:', e); process.exit(1); });