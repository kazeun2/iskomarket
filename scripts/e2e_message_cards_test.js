require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error('Missing env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

async function ensureUser(email) {
  const { data: created, error } = await admin.auth.admin.createUser({ email, password: 'TestPass123!', user_metadata: { test: true }, email_confirm: true }).catch(() => ({}));
  if (error && error.statusCode !== 409) throw error;
  if (created) return created.user.id || created.id || created.user;

  const { data: userRow } = await admin.from('users').select('id').eq('email', email).limit(1).maybeSingle();
  return userRow.id;
}

async function run() {
  const buyerEmail = `test.buyer+${Date.now()}@example.com`;
  const sellerEmail = `test.seller+${Date.now()}@example.com`;

  const buyerId = await ensureUser(buyerEmail);
  const sellerId = await ensureUser(sellerEmail);

  const prodRes = await admin.from('products').insert({ title: 'E2E card product', description: 'E2E product', price: 1, seller_id: sellerId, category_id: null, condition: 'Good', location: 'Test', images: [], is_available: true, is_deleted: false, is_hidden: false }).select('id').single();
  if (prodRes.error) { console.error('Product insert error:', prodRes.error); process.exit(1); }
  const prod = prodRes.data;

  const { data: conv } = await admin.from('conversations').insert({ product_id: prod.id, buyer_id: buyerId, seller_id: sellerId }).select('id').single();
  console.log('Conversation id:', conv.id);

  const { data: inserted, error: insertErr } = await admin.from('messages').insert({ conversation_id: conv.id, sender_id: buyerId, receiver_id: sellerId, message_text: 'Hello, create cards', is_read: false }).select('*').single();
  if (insertErr) { console.error('Insert error:', insertErr); process.exit(1); }
  console.log('Inserted message id:', inserted.id);

  // Wait a short moment for triggers to run
  await new Promise(r => setTimeout(r, 1200));

  const { data: cards, error: cardErr } = await admin.from('message_cards').select('*').or(`conversation_id.eq.${conv.id},conversation_id.eq.${conv.id}`).limit(10);
  if (cardErr) {
    console.error('Failed to query message_cards:', cardErr);
    process.exit(1);
  }

  console.log('Found message_cards:', cards.length);
  console.log(cards);

  if (cards.length >= 2) {
    console.log('Message cards created successfully');
    process.exit(0);
  } else {
    console.error('Message cards missing; expected 2 (buyer and seller).');
    process.exit(2);
  }
}

run().catch(e => { console.error('Test failed:', e); process.exit(1); });