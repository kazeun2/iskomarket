/**
 * Simple test script to validate meetup upsert + message creation using service role key
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/test_meetup_flow.js
 * NOTE: This script creates temporary rows and attempts to clean them up. Run in a test DB or ensure credentials are service-role.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('Starting meetup flow test');
  // Create two users, one product, and optionally a conversation
  const buyerEmail = `test-buyer+${Date.now()}@example.com`;
  const sellerEmail = `test-seller+${Date.now()}@example.com`;

  // Create auth users using the admin API (service role client) and upsert minimal user_profile
  const { data: createdA, error: errA } = await supabase.auth.admin.createUser({ email: buyerEmail, password: 'TestPass123!', user_metadata: { username: 'test_buyer' }, email_confirm: true });
  console.log('createUser response A:', { createdA, errA });
  if (errA) throw errA;
  const buyer = createdA?.id || createdA?.user?.id || createdA?.user?.id || null;

  const { data: createdB, error: errB } = await supabase.auth.admin.createUser({ email: sellerEmail, password: 'TestPass123!', user_metadata: { username: 'test_seller' }, email_confirm: true });
  console.log('createUser response B:', { createdB, errB });
  if (errB) throw errB;
  const seller = createdB?.id || createdB?.user?.id || null;

  // Upsert minimal user_profile rows so foreign keys from transactions/conversations are satisfied
  try {
    const upA = await supabase.from('user_profile').upsert([{ user_id: buyer }]);
    const upB = await supabase.from('user_profile').upsert([{ user_id: seller }]);
    if (upA.error) console.warn('user_profile upsert A warning:', upA.error);
    if (upB.error) console.warn('user_profile upsert B warning:', upB.error);
  } catch (e) { console.warn('user_profile upsert threw:', e); }

  console.log('Created buyer/seller:', buyer, seller);

  const productResp = await supabase
    .from('products')
    .insert([{ title: 'TEST PRODUCT ' + Date.now(), seller_id: seller, description: 'Test', price: 1.00, category: 'Test', condition: 'Good' }])
    .select('id')
    .single();
  console.log('product insert response:', productResp);
  const product = productResp.data;

  console.log('Created product:', product?.id);

  // Create a conversation for the product
  const convResp = await supabase
    .from('conversations')
    .insert([{ product_id: product?.id, buyer_id: buyer, seller_id: seller }])
    .select('id')
    .single();
  console.log('conversation insert response:', convResp);
  const conv = convResp.data;

  console.log('Created conversation:', conv?.id);

  // Call RPC upsert_meetup_and_notify
  const meetupLocation = 'CvSU Main Gate - Test';

  const { data: txResult, error: rpcError } = await supabase.rpc('upsert_meetup_and_notify', {
    p_product_id: product.id,
    p_buyer_id: buyer.id,
    p_seller_id: seller.id,
    p_amount: 1.00,
    p_meetup_location: meetupLocation,
    p_initiator_id: buyer.id
  });

  if (rpcError) {
    console.error('RPC returned error:', rpcError.message || rpcError);
    process.exit(1);
  }

  console.log('RPC result:', txResult);

  // Poll messages for the automated meetup notification
  const timeoutAt = Date.now() + 10000;
  let found = null;
  while (Date.now() < timeoutAt) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(5);

    found = msgs.find(m => m.automation_type === 'meetup_notification' || (m.message_text || '').includes('Meet-up agreed'));
    if (found) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (found) {
    console.log('SUCCESS: Found automated meetup message:', found);
  } else {
    console.error('FAIL: No automated meetup message found (check trigger/function/policies)');
    process.exit(2);
  }

  // Cleanup: remove test rows
  try {
    await supabase.from('messages').delete().eq('conversation_id', conv.id);
    await supabase.from('conversations').delete().eq('id', conv.id);
    await supabase.from('transactions').delete().eq('product_id', product.id);
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('users').delete().in('email', [buyerEmail, sellerEmail]);
    console.log('Cleanup completed');
  } catch (e) {
    console.warn('Cleanup encountered errors:', e);
  }

  console.log('Test finished successfully');
  process.exit(0);
}

run().catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});