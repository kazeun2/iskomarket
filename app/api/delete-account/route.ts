// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Delete account route requires service role key.');
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body || {};
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token || !userId) {
      return NextResponse.json({ error: 'Missing auth token or userId' }, { status: 401 });
    }

    // Clear, early error when server is misconfigured for admin operations
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Delete account route misconfigured: SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json({ error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Verify token belongs to the requesting user
    const clientWithToken = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: userData, error: userErr } = await clientWithToken.auth.getUser();
    if (userErr || !userData?.user || userData.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Perform cleanup of dependent records (customize list to your schema)
    // NOTE: Adjust these deletes to match your database table/column names
    // Delete products posted by user
    await supabaseAdmin.from('products').delete().eq('seller_id', userId);

    // Delete messages & conversations involving user
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await supabaseAdmin.from('conversations').delete().or(`user_a.eq.${userId},user_b.eq.${userId}`);

    // Delete orders where user was buyer or seller
    await supabaseAdmin.from('orders').delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    // Delete reviews and ratings by/to user
    await supabaseAdmin.from('reviews').delete().or(`author_id.eq.${userId},target_id.eq.${userId}`);

    // Remove avatar / user files from storage (example: avatars bucket)
    try {
      const { data: files } = await supabaseAdmin.storage.from('avatars').list(`${userId}`, { limit: 100 });
      if (files) {
        const filePaths = files.map((f: any) => `${userId}/${f.name}`);
        if (filePaths.length > 0) {
          await supabaseAdmin.storage.from('avatars').remove(filePaths);
        }
      }
    } catch (storageErr) {
      console.warn('Failed to clean storage objects for user:', userId, storageErr);
    }

    // Delete the public profile row
    const { error: profileErr } = await supabaseAdmin.from('users').delete().eq('id', userId);
    if (profileErr) {
      console.error('Failed to delete users row:', profileErr);
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
    }

    // Finally delete Auth user
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (err) {
      console.error('Failed to delete auth user:', err);
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete account route failed', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete account' }, { status: 500 });
  }
}
