import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side route: handles sign-up and profile creation
// Requires the following env variables (server only):
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY (used to call auth.signUp)
// - SUPABASE_SERVICE_ROLE_KEY (service role, MUST NOT be exposed to browser)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing SUPABASE url or anon key in env for register route');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE service role key in env for register route');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username, program = '', college = '' } = body || {};

    // Minimal validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // 1) Create auth user using anon key (this keeps auth API usage consistent)
    const { data: signData, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, program, college },
      },
    });

    if (signError) {
      return NextResponse.json({ error: signError.message || signError }, { status: 400 });
    }

    if (!signData?.user) {
      return NextResponse.json({ error: 'No user returned from signUp' }, { status: 500 });
    }

    const user = signData.user;

    // 2) Insert profile into public.users using service role key (server-only)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email,
        username,
        program,
        college,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .limit(1);

    if (insertError) {
      // Attempt to rollback by deleting the created auth user (admin API)
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      } catch (deleteErr) {
        console.error('Profile insert failed and deletion also failed', insertError, deleteErr);
      }

      console.error('Profile insert failed', insertError);
      return NextResponse.json({ error: insertError.message || insertError }, { status: 500 });
    }

    // Success
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error('Register route error', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
