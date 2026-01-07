/**
 * Test script to check messages table columns
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking messages table schema...\n');

    // Get one message to see its structure
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (messages && messages.length > 0) {
      console.log('Message structure:');
      const msg = messages[0];
      console.log('Columns:', Object.keys(msg));
      console.log('\nFirst message:', msg);
    } else {
      console.log('No messages found in database');
    }

    // Also check conversations table
    console.log('\n\nChecking conversations table schema...\n');
    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      console.error('Error fetching conversations:', convError);
    } else if (convs && convs.length > 0) {
      console.log('Conversation structure:');
      const conv = convs[0];
      console.log('Columns:', Object.keys(conv));
      console.log('\nFirst conversation:', conv);
    } else {
      console.log('No conversations found in database');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkSchema();
