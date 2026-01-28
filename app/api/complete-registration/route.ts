import { NextResponse } from 'next/server'

// REMOVED: Custom complete-registration endpoint. Use Supabase Auth verifyOtp + client-side profile upsert instead.
export async function POST(req: Request) {
  return NextResponse.json({ error: 'CUSTOM_COMPLETE_REGISTRATION_REMOVED', message: 'Use Supabase Auth verifyOtp + client-side profile creation instead.' }, { status: 410 })
}
