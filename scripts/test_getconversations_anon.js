require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// This mimics what the app does - use anon key to query conversations
const anonSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testGetConversations(userId) {
  console.log(`\n🔍 Testing getConversations for user: ${userId}\n`);

  // First, check what conversations exist in the DB (admin view)
  console.log('📊 Admin view (using service role):');
  const { data: adminConvs } = await adminSupabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  console.log(`   Found ${adminConvs?.length || 0} conversations`);

  // Now test with anon key (what the app uses)
  console.log('\n🔐 Anon view (what app uses):');

  // Test 1: OR query
  console.log('   Test 1: OR filter query');
  const { data: orRows, error: orErr } = await anonSupabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  console.log(`     Result: ${orRows?.length || 0} rows, error: ${orErr?.message || 'none'}`);

  // Test 2: Separate buyer query
  console.log('   Test 2: buyer_id.eq query');
  const { data: buyerRows, error: buyerErr } = await anonSupabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', userId);
  console.log(`     Result: ${buyerRows?.length || 0} rows, error: ${buyerErr?.message || 'none'}`);

  // Test 3: Separate seller query
  console.log('   Test 3: seller_id.eq query');
  const { data: sellerRows, error: sellerErr } = await anonSupabase
    .from('conversations')
    .select('*')
    .eq('seller_id', userId);
  console.log(`     Result: ${sellerRows?.length || 0} rows, error: ${sellerErr?.message || 'none'}`);

  // Test 4: Check if user is authenticated
  console.log('\n   Test 4: Check authentication');
  const { data: { user }, error: authErr } = await anonSupabase.auth.getUser();
  console.log(`     User: ${user ? user.id : 'not authenticated'}`);
  console.log(`     Error: ${authErr?.message || 'none'}`);

  // Test 5: Try with explicit RLS bypass (if available)
  console.log('\n   Test 5: Direct SQL through Postgres changes');
  const { data: msgCount } = await anonSupabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  console.log(`     Messages for user: ${msgCount || 0}`);
}

// Test with the user from the screenshots
const testUserId = 'e3693161-a34a-45f8-a846-469cebca7941';
testGetConversations(testUserId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
