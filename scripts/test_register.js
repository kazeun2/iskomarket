/* Test script: simulate the app's register flow against Supabase using anon key in .env
   Usage: node scripts/test_register.js
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const testEmail = `qa.test.user+${Date.now()}@cvsu.edu.ph`;
  const password = 'TestPass123!';
  const username = 'qatestuser';

  console.log('Signing up user:', testEmail);

  let userId = null;

  // If a service role key is available in the test environment, create a confirmed user directly via the admin API
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  let signUpData = null;
  if (SERVICE_ROLE) {
    console.log('Service role key available: creating user via admin API');
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password,
      user_metadata: { username },
      email_confirm: true,
    });
    if (createErr) {
      console.warn('Admin createUser failed, falling back to signUp:', createErr.message || createErr);
      const { data, error } = await supabase.auth.signUp({ email: testEmail, password });
      signUpData = data;
      if (error) {
        console.warn('Sign-up warning:', error.message || error);
      } else {
        userId = data?.user?.id;
      }
    } else {
      console.log('Admin user created:', created?.id || created?.user?.id || created);
      // created may be the user object or wrapper; attempt to extract id
      userId = created?.id || created?.user?.id || null;
    }
  } else {
    // Try to sign up the user. If SMTP/confirmation errors occur, do not abort; attempt to sign-in immediately.
    const { data, error } = await supabase.auth.signUp({ email: testEmail, password });
    signUpData = data;
    if (error) {
      console.warn('Sign-up warning:', error.message || error);
      const msg = error.message || '';
      if (msg.toLowerCase().includes('confirmation') || msg.toLowerCase().includes('sending') || msg.toLowerCase().includes('smtp')) {
        console.warn('\nSMTP/confirmation error detected (non-fatal). Continuing to sign-in attempt...');
      } else {
        console.error('Sign-up error (fatal):', error);
        process.exit(1);
      }
    } else {
      console.log('Sign-up success, user id:', data?.user?.id);
      userId = data?.user?.id;
    }
  }

  // Attempt to sign in immediately so the test can proceed without email verification
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: testEmail, password });
    if (signInError) {
      console.warn('Sign-in after signUp failed:', signInError.message || signInError);

      // If possible, try to auto-confirm the user using the service role key (Node.js env available here)
      const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      if (SERVICE_ROLE && userId) {
        try {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
          const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
          if (updateErr) {
            console.warn('Auto-confirm in test failed:', updateErr);
          } else {
            console.log('Auto-confirmed user in test:', userId);
            const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({ email: testEmail, password });
            if (!signInError2) {
              userId = signInData2.user?.id || userId;
              console.log('Signed in user after auto-confirm:', userId);
            }
          }
        } catch (ae) {
          console.warn('Auto-confirm attempt threw:', ae);
        }
      }

      if (!userId) {
        console.error('Unable to sign in or obtain user id. Aborting.');
        process.exit(1);
      }
    } else {
      userId = signInData?.user?.id || userId;
      console.log('Signed in user:', userId);
    }
  } catch (e) {
    console.warn('Sign-in attempt threw:', e);
    if (!userId) {
      console.error('Unable to sign in or obtain user id. Aborting.');
      process.exit(1);
    }
  }

  const profile = {
    id: userId,
    email: testEmail,
    username,
    date_registered: new Date().toISOString(),
    is_admin: false,
  };
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .upsert([profile], { onConflict: 'id' })
    .select()
    .single();

  if (profileError) {
    console.error('Profile upsert error:', profileError);
    if (profileError.message && profileError.message.toLowerCase().includes("'name'")) {
      console.error("The 'users' table in your database doesn't have a 'name' column. Either remove 'name' from the insert payload or add the 'name' column to the users table.");
    }
  } else {
    console.log('Profile upserted:', profileData);
  }

  // Attempt to read back the profile
    const { data: fetched, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

  if (fetchError) {
    console.error('Profile fetch error:', fetchError);
  } else {
    console.log('Fetched profile:', fetched);
  }

  // Probe for schema discrepancies: try selecting known/misnamed columns
  console.log('\nProbing column availability');
  const probeCols = ['full_name', 'created_at', 'date_registered'];
  for (const col of probeCols) {
    try {
      const { data: pData, error: pErr } = await supabase.from('users').select(col).limit(1);
      if (pErr) {
        console.warn(`Column probe '${col}' error:`, pErr.message || pErr);
      } else {
        console.log(`Column '${col}' is selectable.`);
      }
    } catch (e) {
      console.warn(`Probe '${col}' threw:`, e.message || e);
    }
  }
}

run().catch((e) => {
  console.error('Unexpected error:', e);
});