require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  console.log('Scanning for orphan messages (conversation_id IS NULL and product_id IS NOT NULL)');

  // Page through messages to be safe
  let page = 0;
  const pageSize = 200;
  while (true) {
    console.log(`Fetching page ${page}`);
    const { data: messages, error } = await admin
      .from('messages')
      .select('id, sender_id, receiver_id, product_id')
      .is('conversation_id', null)
      .not('product_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (error) {
      console.error('Error querying messages:', error);
      process.exit(1);
    }

    if (!messages || messages.length === 0) {
      console.log('No more orphan messages found');
      break;
    }

    for (const m of messages) {
      try {
        console.log('Processing message', m.id);

        // Find existing conversation
        const { data: existing, error: existingErr } = await admin
          .from('conversations')
          .select('id, buyer_id, seller_id')
          .or(`and(product_id.eq.${m.product_id},buyer_id.eq.${m.sender_id},seller_id.eq.${m.receiver_id}),and(product_id.eq.${m.product_id},buyer_id.eq.${m.receiver_id},seller_id.eq.${m.sender_id})`)
          .limit(1)
          .maybeSingle();

        if (existing && existing.id) {
          // Update message
          await admin.from('messages').update({ conversation_id: existing.id }).eq('id', m.id);
          console.log('Linked to existing conversation', existing.id);
          continue;
        }

        // Need to create conversation: fetch product seller
        const { data: prod, error: prodErr } = await admin.from('products').select('id, seller_id').eq('id', m.product_id).maybeSingle();
        if (prodErr || !prod) {
          console.warn('Product not found or error, skipping message', m.id, prodErr);
          continue;
        }

        const sellerId = prod.seller_id;
        if (!sellerId) {
          console.warn('Product has no seller, skipping message', m.id);
          continue;
        }

        let buyerId = m.sender_id === sellerId ? m.receiver_id : m.sender_id;

        // Create conversation
        const { data: created, error: createErr } = await admin.from('conversations').insert({ product_id: m.product_id, buyer_id: buyerId, seller_id }).select('id').single();
        if (createErr) {
          console.error('Failed to create conversation for message', m.id, createErr);
          continue;
        }

        const convId = created.id;
        await admin.from('messages').update({ conversation_id: convId }).eq('id', m.id);
        console.log('Created conversation', convId, 'and linked message', m.id);
      } catch (e) {
        console.error('Unexpected error processing message', m.id, e);
      }
    }

    if (messages.length < pageSize) break;
    page += 1;
  }

  console.log('Orphan messages fix script completed');
}

run().catch(e => { console.error(e); process.exit(1); });