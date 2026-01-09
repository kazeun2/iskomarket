require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error('Missing env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, ANON, { realtime: { params: { eventsPerSecond: 25 } }, auth: { persistSession: false } });
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 25 } } });

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

  const prodRes = await admin.from('products').insert({ title: 'E2E realtime product', description: 'E2E product', price: 1, seller_id: sellerId, category_id: null, condition: 'Good', location: 'Test', images: [], is_available: true, is_deleted: false, is_hidden: false }).select('id').single();
  if (prodRes.error) { console.error('Product insert error:', prodRes.error); process.exit(1); }
  const prod = prodRes.data;

  const { data: conv } = await admin.from('conversations').insert({ product_id: prod.id, buyer_id: buyerId, seller_id: sellerId }).select('id').single();

  // Sign in seller client so subscription uses seller session (RLS will allow message_cards for that user)
  const sellerClient = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 25 } } });
  const { data: signData, error: signErr } = await sellerClient.auth.signInWithPassword({ email: sellerEmail, password: 'TestPass123!' });
  if (signErr) { console.error('Seller sign-in failed:', signErr); process.exit(1); }

  const events = [];

  // Subscribe to message_cards for seller
  const chCards = sellerClient.channel('test-cards-cards')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_cards', filter: `user_id=eq.${sellerId}` }, payload => {
      console.log('Seller saw message_cards event:', payload.event || payload.eventType, payload.new || payload.old);
      events.push({ type: 'cards', payload });
    })
    .subscribe();

  // Also subscribe to messages (INSERT) so we can confirm realtime is working for messages
  const chMessages = sellerClient.channel('test-cards-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${sellerId}` }, payload => {
      console.log('Seller saw messages event:', payload.event || payload.eventType, payload.new || payload.old);
      events.push({ type: 'messages', payload });
    })
    .subscribe();

  // Wait for subscription
  await new Promise(r => setTimeout(r, 3500));

  // Insert a message as buyer which should create/update message_cards for seller
  const { data: inserted, error: insertErr } = await admin.from('messages').insert({ conversation_id: conv.id, sender_id: buyerId, receiver_id: sellerId, message_text: 'Realtime check', is_read: false }).select('*').single();
  if (insertErr) { console.error('Insert error:', insertErr); process.exit(1); }

  console.log('Inserted message id:', inserted.id);

  // Wait up to 7s for events
  let got = await new Promise(resolve => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (events.length > 0) { clearInterval(iv); resolve(true); }
      else if (Date.now() - t0 > 7000) { clearInterval(iv); resolve(false); }
    }, 200);
  });

  console.log('Got subscription events (messages?):', got, 'count:', events.length);

  // If we didn't see message_cards events, try a manual admin insert/upsert into message_cards to test whether message_cards replicas are enabled for realtime
  if (!events.some(e => e.type === 'cards')) {
    console.log('No message_cards events observed yet. Performing manual admin upsert to message_cards to test realtime for that table...');

    // Create a separate conversation to avoid conflicts
    const { data: conv2, error: conv2Err } = await admin.from('conversations').insert({ product_id: prod.id, buyer_id: buyerId, seller_id: sellerId }).select('id').single();
    if (conv2Err || !conv2) {
      console.error('Failed to create conv2 for manual test:', conv2Err);
      // Try to find existing conversation matching these participants
      const { data: existingConv, error: findErr } = await admin.from('conversations').select('id').match({ product_id: prod.id, buyer_id: buyerId, seller_id: sellerId }).limit(1).maybeSingle();
      if (findErr || !existingConv) {
        console.error('Also failed to find existing conversation for manual test:', findErr);
      } else {
        console.log('Found existing conversation to use for manual test:', existingConv.id);
        const manualRes = await admin.from('message_cards').upsert({ conversation_id: existingConv.id, user_id: sellerId, other_user_id: buyerId, product_id: prod.id, last_message: 'manual test', last_message_at: new Date().toISOString(), unread_count: 1, status: 'active' }, { onConflict: 'conversation_id,user_id' }).select('*').single();
        if (manualRes.error) {
          console.error('Manual upsert into message_cards failed:', manualRes.error);
        } else {
          console.log('Manual message_cards upsert id:', manualRes.data && manualRes.data.id);
        }
      }
    } else {
      const manualRes = await admin.from('message_cards').insert({ conversation_id: conv2.id, user_id: sellerId, other_user_id: buyerId, product_id: prod.id, last_message: 'manual test', last_message_at: new Date().toISOString(), unread_count: 1, status: 'active' }).select('*').single();
      if (manualRes.error) {
        console.error('Manual insert into message_cards failed:', manualRes.error);
      } else {
        console.log('Manual message_cards insert id:', manualRes.data && manualRes.data.id);
      }
    }

    // wait for events again
    got = await new Promise(resolve => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (events.length > 0) { clearInterval(iv); resolve(true); }
        else if (Date.now() - t0 > 7000) { clearInterval(iv); resolve(false); }
      }, 200);
    });

    console.log('After manual insert, got subscription events:', got, 'total count:', events.length);
  }

  // Cleanup
  try { await anon.removeChannel(chCards); } catch (e) {}
  try { await anon.removeChannel(chMessages); } catch (e) {}

  if (!events.some(e => e.type === 'cards')) process.exit(2);
  process.exit(0);
}

run().catch(e => { console.error('Test failed:', e); process.exit(1); });