require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('📊 Detailed conversation analysis...\n');

  // Get all conversations with message counts
  const { data: convs } = await adminSupabase.from('conversations').select('id, buyer_id, seller_id, product_id, created_at');
  console.log(`Found ${convs?.length || 0} conversations\n`);

  // For each conversation, count messages
  for (const conv of convs || []) {
    const { data: msgs, count } = await adminSupabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id);

    console.log(`Conv ${conv.id.substring(0, 8)}...`);
    console.log(`  Buyer: ${conv.buyer_id?.substring(0, 8)}...`);
    console.log(`  Seller: ${conv.seller_id?.substring(0, 8)}...`);
    console.log(`  Product: ${conv.product_id || 'none'}`);
    console.log(`  Messages: ${count || 0}`);
    console.log('');
  }

  // Show which user IDs appear most in messages
  const { data: msgs } = await adminSupabase.from('messages').select('sender_id, receiver_id');
  const userIds = new Set();
  (msgs || []).forEach(m => {
    userIds.add(m.sender_id);
    userIds.add(m.receiver_id);
  });

  console.log(`\n👥 Unique users in messages: ${userIds.size}`);
  const userArray = Array.from(userIds).slice(0, 5);
  userArray.forEach(uid => console.log(`  - ${uid}`));

  // For the current user from browser (e3693161-a34a-45f8-a846-469cebca7941)
  const currentUserId = 'e3693161-a34a-45f8-a846-469cebca7941';
  console.log(`\n🔍 Conversations for user ${currentUserId.substring(0, 8)}...:`);

  const { data: userConvs } = await adminSupabase
    .from('conversations')
    .select('id, buyer_id, seller_id, product_id')
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`);

  console.log(`  Found ${userConvs?.length || 0} conversations where user is buyer or seller`);
  (userConvs || []).forEach(c => {
    console.log(`    - Conv ${c.id.substring(0, 8)}... (buyer=${c.buyer_id?.substring(0, 8)}... seller=${c.seller_id?.substring(0, 8)}...)`);
  });

  // Check if user is sender/receiver in any messages
  const { data: userMsgs } = await adminSupabase
    .from('messages')
    .select('id, sender_id, receiver_id, conversation_id')
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

  console.log(`\n  Found ${userMsgs?.length || 0} messages where user is sender or receiver`);
  if (userMsgs && userMsgs.length > 0) {
    console.log(`    Sample message convs:`);
    userMsgs.slice(0, 3).forEach(m => {
      console.log(`      - Conv ${m.conversation_id?.substring(0, 8) || 'NULL'}...`);
    });
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
