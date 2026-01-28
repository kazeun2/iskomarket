import { NextResponse } from 'next/server'

// REMOVED: This endpoint previously implemented a custom OTP send flow (OTP DB table + SendGrid).
// Per project policy we now rely exclusively on Supabase Auth built-in OTP flows (signInWithOtp / verifyOtp).
// Keep this stub to return 410 (Gone) to avoid accidental usage.

export async function POST(req: Request) {
  return NextResponse.json({ error: 'CUSTOM_OTP_REMOVED', message: 'Custom OTP endpoint removed; use Supabase Auth signInWithOtp instead.' }, { status: 410 })
}
