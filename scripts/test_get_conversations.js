/**
 * Test script to verify getConversations query
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetConversations() {
  try {
    console.log('Testing getConversations query...\n');

    // Get all messages
    console.log('1. Fetching ALL messages from database:');
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, message_text, content, message, product_id, is_read, created_at, conversation_id')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all messages:', allError);
    } else {
      console.log(`Found ${allMessages?.length || 0} total messages:`, allMessages);
    }

    // Test specific user IDs
    console.log('\n2. Testing with sample user IDs:');
    const testUserIds = [
      'hazel.perez@example.com',
      'gfgfgf@example.com',
      'hazel-perez-user-id',
      'gfgfgf-user-id'
    ];

    for (const userId of testUserIds) {
      console.log(`\n  Testing user: ${userId}`);
      
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id')
        .eq('sender_id', userId)
        .limit(5);
      
      if (!sentError) {
        console.log(`    - Sent: ${sentMessages?.length || 0} messages`);
      }
      
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id')
        .eq('receiver_id', userId)
        .limit(5);
      
      if (!receivedError) {
        console.log(`    - Received: ${receivedMessages?.length || 0} messages`);
      }
    }

    // Check users table
    console.log('\n3. Checking users in database:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, username')
      .limit(10);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`Found ${users?.length || 0} users:`, users);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGetConversations();
