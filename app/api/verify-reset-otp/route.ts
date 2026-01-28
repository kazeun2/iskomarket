import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side proxy for verifying password reset OTPs. Returns a small JSON shape { ok: boolean, message?: string }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body?.email || '').toString().trim()
    const code = (body?.code || '').toString().trim()

    if (!email || !code) {
      return NextResponse.json({ ok: false, message: 'Missing email or code' }, { status: 200 })
    }

    // Create an admin Supabase client using the service role key (server-only)
    const SUPABASE_URL = process.env.SUPABASE_URL || ''
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ ok: false, message: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

    // Call Supabase verifyOtp using the server-side client so the browser does NOT call /auth/v1/verify directly.
    const type = (body?.type || 'recovery').toString()
    const resp = await admin.auth.verifyOtp({ email, token: code, type } as any)
    const verifyError = (resp as any).error

    if (verifyError) {
      const msg = (verifyError?.message || '').toString().toLowerCase()
      if ((verifyError as any)?.status === 403 || msg.includes('forbidden') || msg.includes('invalid') || msg.includes('expired') || msg.includes('otp_expired')) {
        // Treat invalid/expired tokens as client errors
        return NextResponse.json({ ok: false, message: 'Incorrect or expired code. Please try again.' }, { status: 400 })
      }
      if (msg.includes('too many') || msg.includes('rate limit') || (verifyError as any)?.status === 429) {
        return NextResponse.json({ ok: false, message: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
      }

      // Any other SDK error treat as fatal (infrastructure)
      return NextResponse.json({ ok: false, message: 'Verification failed. Please try again later.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    // Catch any unexpected server-side error and return a friendly JSON payload
    try { console.error('verify-reset-otp endpoint error', e) } catch (d) { /* no-op */ }
    return NextResponse.json({ ok: false, message: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}
