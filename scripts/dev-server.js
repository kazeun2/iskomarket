#!/usr/bin/env node
/* Small dev-only server to create Supabase users using the service_role key.
   Usage (local development only):
   - Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env
   - Run: npm run dev:server
   - The frontend will call POST http://localhost:9999/dev/create-user with { email, password, username }

   WARNING: This server exposes your service_role key locally. Use ONLY in development and never commit your service_role key.
*/
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

let NO_ADMIN = false
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.warn('WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. The dev server will run in limited mode (no admin Supabase client). Some admin routes will return simulated responses.')
  NO_ADMIN = true
}

const app = express();
app.use(bodyParser.json());

const supabaseAdmin = (!NO_ADMIN ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } }) : null);

app.post('/dev/create-user', async (req, res) => {
  const { email, password, username } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    // Use the Admin API to create a confirmed user so client login works immediately
    // First try creating user with `email_confirm: true` (supported by some Supabase versions)
    let created = null
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { username },
        email_confirm: true,
      })
      if (!error) created = data
      else console.warn('createUser with email_confirm failed (will retry without):', error)
    } catch (e) {
      console.warn('createUser attempt threw (will retry without email_confirm):', e?.message || e)
    }

    // If first attempt failed, try without email_confirm and attempt to mark confirmed after
    if (!created) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: { username },
        })
        if (error) {
          console.error('createUser failed:', error)
          return res.status(500).json({ error })
        }
        created = data
        // Try to mark email confirmed if supported
        try {
          await supabaseAdmin.auth.admin.updateUserById(created.id, { email_confirm: true })
        } catch (uErr) {
          console.warn('Could not auto-confirm created user (ignored):', uErr?.message || uErr)
        }
      } catch (e) {
        console.error('Dev create-user uncaught error:', e)
        return res.status(500).json({ error: e.message || String(e) })
      }
    }

    return res.json({ user: created });
  } catch (err) {
    console.error('Dev create-user error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Dev helper: insert a test OTP into otp_verifications and return the OTP so tests can proceed.
app.post('/dev/insert-otp', async (req, res) => {
  const { email, purpose = 'registration', otp: providedOtp } = req.body || {}
  console.log('dev/insert-otp called', { email, purpose })
  if (!email) return res.status(400).json({ error: 'email is required' })

  const otp = typeof providedOtp === 'string' && /^[0-9]{6}$/.test(providedOtp) ? providedOtp : (Math.floor(100000 + Math.random() * 900000)).toString()

  try {
    const { data, error } = await supabaseAdmin.from('otp_verifications').insert({
      email,
      otp_code: otp,
      purpose,
      is_used: false,
      is_expired: false,
      attempts: 0,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (error) {
      console.error('Dev insert-otp error:', error)
      return res.status(500).json({ error })
    }

    console.log('dev/insert-otp inserted', { email, otp })
    return res.json({ otp })
  } catch (err) {
    console.error('Dev insert-otp uncaught error:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

// Dev helper: proxy verify-reset-otp so browser dev-run uses this local server instead of calling Supabase directly
app.post('/dev/verify-reset-otp', async (req, res) => {
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(200).json({ ok: false, message: 'Missing email or code' })

  try {
    if (!supabaseAdmin) {
      // Dev helper not configured with admin keys — return a clear misconfiguration response so devs know to set env vars
      return res.status(500).json({ ok: false, message: 'Dev server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable real verification.' })
    }

    // Call Supabase verifyOtp using the admin client
    const resp = await supabaseAdmin.auth.verifyOtp({ email, token: code, type: 'recovery' })
    const verifyError = resp?.error
    if (verifyError) {
      const msg = (verifyError?.message || '').toString().toLowerCase()
      if ((verifyError && (verifyError.status || verifyError.statusCode)) === 403 || msg.includes('forbidden') || msg.includes('invalid') || msg.includes('expired') || msg.includes('otp_expired')) {
        // Treat invalid/expired tokens as a client error (400)
        return res.status(400).json({ ok: false, message: 'Incorrect or expired code. Please try again.' })
      }
      if (msg.includes('too many') || msg.includes('rate limit') || (verifyError && (verifyError.status || verifyError.statusCode)) === 429) {
        return res.status(429).json({ ok: false, message: 'Too many attempts. Try again in a few minutes.' })
      }
      return res.status(500).json({ ok: false, message: 'Verification failed. Please try again later.' })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Dev verify-reset-otp error', e)
    return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again later.' })
  }
})

// Dev helper: optionally fetch the latest OTP for an email (useful for tests that want to assert verification works)
app.get('/dev/latest-otp', async (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ error: 'email is required' })

  try {
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return res.status(500).json({ error })
    if (!data) return res.status(404).json({ error: 'no otp found' })

    return res.json({ otp: data.otp_code, record: data })
  } catch (err) {
    console.error('Dev latest-otp error:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
})

const port = parseInt(process.env.DEV_SERVER_PORT || '9999', 10);
const server = app.listen(port, () => {
  console.log(`Dev create-user server running on http://localhost:${port}`);
});
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Is another dev server running?`);
  } else {
    console.error('Dev server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in dev server:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in dev server:', reason);
  process.exit(1);
});
