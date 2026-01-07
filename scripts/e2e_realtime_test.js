/*
  End-to-end realtime test script
  - Subscribes (viewer client) to INSERT events on `products` and `messages`
  - Signs in as TEST_POSTER to create a product and create a conversation + message
  - Verifies viewer sees INSERT events

  Requirements in .env:
    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY
    TEST_POSTER_EMAIL
    TEST_POSTER_PASSWORD
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const POSTER_EMAIL = process.env.TEST_POSTER_EMAIL;
const POSTER_PASSWORD = process.env.TEST_POSTER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
  process.exit(1);
}
if (!POSTER_EMAIL || !POSTER_PASSWORD) {
  console.error('Missing TEST_POSTER_EMAIL or TEST_POSTER_PASSWORD in env');
  process.exit(1);
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 10 } } });
const posterClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 10 } } });

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function signIn() {
  const { data, error } = await posterClient.auth.signInWithPassword({ email: POSTER_EMAIL, password: POSTER_PASSWORD });
  if (error) {
    console.error('Sign-in error:', error);
    return null;
  }
  return data?.user?.id;
}

async function run() {
  console.log('Starting realtime E2E test...');

  const posterId = await signIn();
  if (!posterId) process.exit(1);
  console.log('Signed in poster userId:', posterId);

  const events = { products: [], messages: [] };

  const productListener = anonClient.channel('watch-products')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, payload => {
      console.log('[VIEWER] product INSERT', payload.new ? { id: payload.new.id, seller_id: payload.new.seller_id } : payload);
      events.products.push(payload.new || payload);
    })
    .subscribe();

  const messageListener = anonClient.channel('watch-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      console.log('[VIEWER] message INSERT', payload.new ? { id: payload.new.id, conversation_id: payload.new.conversation_id, sender_id: payload.new.sender_id } : payload);
      events.messages.push(payload.new || payload);
    })
    .subscribe();

  // give subscriptions a moment to establish
  await wait(3000);

  // helper: insert with retries for transient schema-cache errors (PGRST204 / "schema cache")
  async function insertWithRetry(client, table, payload, attempts = 8) {
    let i = 0;
    let lastErr = null;
    while (i < attempts) {
      const { data, error } = await client.from(table).insert(payload).select('*').single();
      if (!error) return { data, error: null };
      lastErr = error;
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'PGRST204' || msg.includes('schema cache') || msg.includes("could not find")) {
        // Increase backoff to give cache time to warm
        const backoff = 750 * Math.pow(2, i);
        console.warn(`Transient schema-cache error on insert to ${table}, retrying in ${backoff}ms (attempt ${i+1}/${attempts})`, error.message || error);
        await wait(backoff);
        i++;
        continue;
      }
      // Non-transient error
      return { data: null, error };
    }
    return { data: null, error: lastErr };
  }

  // Create a product as the poster (with retry)
  console.log('Creating product as poster (with retry)...');
  const productPayload = {
    title: `e2e-realtime-product-${Date.now()}`,
    description: 'Realtime test product',
    price: 1,
    category_id: null,
    condition: 'New',
    location: 'Test',
    images: [],
    is_available: true,
    is_deleted: false,
    is_hidden: false,
    seller_id: posterId
  };

  const { data: prodData, error: prodError } = await insertWithRetry(posterClient, 'products', productPayload);
  if (prodError) {
    console.error('Product insert error:', prodError);
  } else {
    console.log('Inserted product id:', prodData.id);
  }

  // Wait up to 5s for viewer event
  const gotProduct = await waitForEvent(() => events.products.length > 0, 5000);
  console.log('Viewer saw product event:', gotProduct);

  // Create a conversation (self-conversation) so we can insert a message
  console.log('Warming schema cache for conversations and messages (selects)');
  async function ensureSchemaAvailable(client, table, timeoutMs = 90000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      // Try multiple forms of a simple select to encourage PostgREST schema cache to warm
      try {
        const probes = [
          await client.from(table).select('id').limit(1),
          await client.from(table).select('*').limit(1),
        ];
        for (const p of probes) {
          if (!p.error) return true;
        }
      } catch (e) {
        // ignore and continue
      }

      console.warn(`Schema not available for ${table}, retrying in 2000ms`);
      await wait(2000);
    }
    return false;
  }

  const convSchemaReady = await ensureSchemaAvailable(posterClient, 'conversations');
  if (!convSchemaReady) console.warn('Conversation schema did not become available in time (will still attempt insert)');

  console.log('Creating conversation (poster -> poster) with retry');
  const convPayload = { buyer_id: posterId, seller_id: posterId, product_id: prodData?.id || null };
  const { data: convData, error: convError } = await insertWithRetry(posterClient, 'conversations', convPayload);
  if (convError) {
    console.error('Conversation insert error:', convError);
  } else {
    console.log('Inserted conversation id:', convData.id);
  }

  // Ensure messages schema is warmed
  const msgSchemaReady = await ensureSchemaAvailable(posterClient, 'messages');
  if (!msgSchemaReady) console.warn('Messages schema did not become available in time (will still attempt insert)');

  // Insert a message (with retry)
  console.log('Inserting message into conversation (with retry)...');
  // Use `message_text` (canonical) if possible to avoid legacy column issues
  const msgPayload = { conversation_id: convData?.id, sender_id: posterId, receiver_id: posterId, message_text: `e2e-realtime-msg-${Date.now()}`, is_read: false };
  const { data: msgData, error: msgError } = await insertWithRetry(posterClient, 'messages', msgPayload);
  if (msgError) {
    console.error('Message insert error:', msgError);
  } else {
    console.log('Inserted message id:', msgData.id);
  }

  const gotMessage = await waitForEvent(() => events.messages.length > 0, 5000);
  console.log('Viewer saw message event:', gotMessage);

  // Cleanup: unsubscribe
  try {
    await anonClient.removeChannel(productListener);
    await anonClient.removeChannel(messageListener);
  } catch (err) {
    // older supabase-js may not support removeChannel; ignore
  }

  console.log('E2E realtime test finished. Summary:', { productsSeen: events.products.length, messagesSeen: events.messages.length });
  process.exit(0);
}

function waitForEvent(checkFn, timeoutMs) {
  const start = Date.now();
  return new Promise(resolve => {
    const iv = setInterval(() => {
      if (checkFn()) {
        clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        resolve(false);
      }
    }, 200);
  });
}

run().catch(err => { console.error('Test error:', err); process.exit(1); });
