require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCount(table) {
  const { count, error } = await supabase.from(table).select('id', { head: true, count: 'exact' });
  if (error) throw error;
  return count;
}

async function fetchAllIds(table, idField = 'id') {
  const ids = new Set();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(`${idField}`)
      .order(idField, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row[idField]) ids.add(row[idField]);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function fetchMessages() {
  const messages = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    messages.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return messages;
}

async function main() {
  console.log('🔍 Verifying conversations and message references (non-destructive)\n');

  const [messagesCount, convCount] = await Promise.all([getCount('messages'), getCount('conversations')]);
  console.log(`📨 Messages: ${messagesCount}`);
  console.log(`💬 Conversations: ${convCount}\n`);

  const convIds = await fetchAllIds('conversations', 'id');
  const messages = await fetchMessages();

  const withoutConv = messages.filter(m => !m.conversation_id);
  const withMissingConv = messages.filter(m => m.conversation_id && !convIds.has(m.conversation_id));

  console.log(`⚠️  Messages WITHOUT conversation_id: ${withoutConv.length}`);
  if (withoutConv.length > 0) console.log('   Sample IDs:', withoutConv.slice(0, 10).map(m => m.id));

  console.log(`⚠️  Messages referencing MISSING conversations: ${withMissingConv.length}`);
  if (withMissingConv.length > 0) console.log('   Sample message IDs:', withMissingConv.slice(0, 10).map(m => ({ id: m.id, conversation_id: m.conversation_id })));

  if (convCount > 0) {
    console.log('\n✅ Conversation rows exist at least: yes');
  } else {
    console.log('\n❌ Conversation rows exist at least: NO');
  }

  if (withoutConv.length === 0 && withMissingConv.length === 0) {
    console.log('✅ All messages either have valid conversation_id or none are missing (no orphaned refs)');
  } else {
    console.log('⚠️ Some messages are missing conversation_id or reference missing conversations');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error during check:', err.message || err);
  process.exit(1);
});