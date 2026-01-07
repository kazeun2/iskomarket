require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
// Use admin key to bypass RLS and access all data
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🔍 Diagnosing conversation/message issues...\n');

  // 1. Get all messages and their conversations
  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, conversation_id, message_text, created_at')
    .order('created_at', { ascending: false });

  if (msgErr) {
    console.error('❌ Error fetching messages:', msgErr);
    return;
  }

  console.log(`📨 Total messages: ${messages?.length || 0}\n`);

  // 2. Get all conversations
  const { data: conversations, error: convErr } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, product_id, created_at')
    .order('created_at', { ascending: false });

  if (convErr) {
    console.error('❌ Error fetching conversations:', convErr);
    return;
  }

  console.log(`💬 Total conversations: ${conversations?.length || 0}\n`);

  // 3. Analyze: find messages with NULL conversation_id
  const messagesWithoutConv = (messages || []).filter(m => !m.conversation_id);
  console.log(`⚠️  Messages WITHOUT conversation_id: ${messagesWithoutConv.length}`);
  if (messagesWithoutConv.length > 0) {
    console.log('   Sample:', messagesWithoutConv.slice(0, 3).map(m => ({ id: m.id, sender: m.sender_id, text: m.message_text })));
  }

  // 4. Analyze: find conversations with NULL buyer_id or seller_id
  const convWithoutUsers = (conversations || []).filter(c => !c.buyer_id || !c.seller_id);
  console.log(`\n⚠️  Conversations with NULL buyer_id or seller_id: ${convWithoutUsers.length}`);
  if (convWithoutUsers.length > 0) {
    console.log('   Sample:', convWithoutUsers.slice(0, 3).map(c => ({ id: c.id, buyer: c.buyer_id, seller: c.seller_id })));
  }

  // 5. For each conversation with NULL users, try to infer from messages
  console.log(`\n🔧 Attempting to repair ${convWithoutUsers.length} conversations...\n`);

  for (const conv of convWithoutUsers) {
    const convMessages = (messages || []).filter(m => m.conversation_id === conv.id);
    if (convMessages.length === 0) {
      console.log(`❌ Conv ${conv.id}: no messages found - cannot infer users`);
      continue;
    }

    // Get the first message to infer buyer/seller
    const firstMsg = convMessages[convMessages.length - 1]; // oldest message
    const lastMsg = convMessages[0]; // newest message
    
    const inferredBuyer = firstMsg.sender_id;
    const inferredSeller = firstMsg.receiver_id;

    console.log(`🔄 Conv ${conv.id.substring(0, 8)}... has ${convMessages.length} messages`);
    console.log(`   Inferred: buyer=${inferredBuyer.substring(0, 8)}... seller=${inferredSeller.substring(0, 8)}...`);

    // Update conversation with inferred buyer/seller
    const { error: updateErr } = await supabase
      .from('conversations')
      .update({ buyer_id: inferredBuyer, seller_id: inferredSeller })
      .eq('id', conv.id);

    if (updateErr) {
      console.log(`   ❌ Update failed: ${updateErr.message}`);
    } else {
      console.log(`   ✅ Updated`);
    }
  }

  // 6. For messages without conversation_id, try to link them or create conversation
  console.log(`\n🔧 Processing ${messagesWithoutConv.length} messages without conversation_id...\n`);

  for (const msg of messagesWithoutConv) {
    // Try to find existing conversation for this sender/receiver pair
    const { data: existingConv, error: convSearchErr } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(buyer_id.eq.${msg.sender_id},seller_id.eq.${msg.receiver_id}),and(buyer_id.eq.${msg.receiver_id},seller_id.eq.${msg.sender_id})`)
      .limit(1)
      .maybeSingle();

    let convId = existingConv?.id;

    if (!convId) {
      // Create new conversation
      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({
          buyer_id: msg.sender_id,
          seller_id: msg.receiver_id,
          product_id: null,
        })
        .select('id')
        .single();

      if (createErr) {
        console.log(`❌ Msg ${msg.id.substring(0, 8)}... - failed to create conversation: ${createErr.message}`);
        continue;
      }

      convId = newConv?.id;
      console.log(`✅ Msg ${msg.id.substring(0, 8)}... - created conversation ${convId.substring(0, 8)}...`);
    } else {
      console.log(`✅ Msg ${msg.id.substring(0, 8)}... - linked to existing conv ${convId.substring(0, 8)}...`);
    }

    // Update message with conversation_id
    const { error: msgUpdateErr } = await supabase
      .from('messages')
      .update({ conversation_id: convId })
      .eq('id', msg.id);

    if (msgUpdateErr) {
      console.log(`   ⚠️  Failed to update message with conversation_id: ${msgUpdateErr.message}`);
    }
  }

  console.log(`\n✅ Repair complete!`);

  // Final summary
  const { data: finalMsgs } = await supabase.from('messages').select('id', { count: 'exact', head: true });
  const { data: finalConvs } = await supabase.from('conversations').select('id', { count: 'exact', head: true });
  
  console.log(`\n📊 Final state:`);
  console.log(`   Messages: ${finalMsgs?.length || 0}`);
  console.log(`   Conversations: ${finalConvs?.length || 0}`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
