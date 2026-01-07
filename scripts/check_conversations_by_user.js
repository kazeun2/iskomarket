require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run(userId) {
  console.log('Checking conversations for user:', userId);
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }

  console.log(`Found ${convs?.length || 0} conversation rows`);

  for (const conv of convs || []) {
    console.log('\nConversation:', conv.id, conv.product_id ? `(product ${conv.product_id})` : 'no product');
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('id, message_text, created_at, sender_id, receiver_id, conversation_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (msgErr) {
      console.warn('Error fetching messages for conversation', conv.id, msgErr);
      continue;
    }
    console.log(`  recent messages: ${msgs?.length || 0}`);
    msgs?.forEach(m => console.log('   -', m.id, m.message_text || m.content || '(no text)', 'from', m.sender_id, 'to', m.receiver_id));
  }

  // If no conversations, try deriving from messages involving user
  if (!convs || convs.length === 0) {
    console.log('No conversation rows; deriving from messages...');
    const { data: messages, error: messagesErr } = await supabase
      .from('messages')
      .select('id, message_text, created_at, sender_id, receiver_id, conversation_id, product_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesErr) {
      console.warn('Error fetching messages for user', messagesErr);
      return;
    }

    console.log(`Found ${messages?.length || 0} messages involving user:`, messages?.map(m => ({ id: m.id, conv: m.conversation_id })) );
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/check_conversations_by_user.js <user_id>');
  process.exit(1);
}

run(userId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });