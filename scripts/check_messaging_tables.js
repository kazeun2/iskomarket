/**
 * Check if messages table exists and create if needed
 * Using individual SQL statements instead of RPC
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTables() {
  try {
    console.log('Checking messages table schema...\n');
    
    // Try to query messages table
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(0);
    
    if (messagesError) {
      console.log('Messages table error:', messagesError.message);
      if (messagesError.code === 'PGRST116') {
        console.log('↳ Table does not exist or no rows match the query');
      }
    } else {
      console.log('✓ Messages table accessible');
    }
    
    // Try to query conversations table
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(0);
    
    if (conversationsError) {
      console.log('Conversations table error:', conversationsError.message);
    } else {
      console.log('✓ Conversations table accessible');
    }
    
    // Try to query notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(0);
    
    if (notificationsError) {
      console.log('Notifications table error:', notificationsError.message);
    } else {
      console.log('✓ Notifications table accessible');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('To create the tables, please:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste the contents of: migrations/20251219-create-messaging-tables.sql');
    console.log('4. Run the query');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndCreateTables();
