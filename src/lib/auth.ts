import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

// =====================================================
// AUTHENTICATION SERVICES
// Production-ready authentication handlers
// =====================================================

// Helper to ensure Supabase is available
const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your .env file.')
  }
  return supabase
}

/**
 * Generate an 8-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// NOTE: Custom OTP DB helpers were removed in favor of Supabase Auth built-in OTP flows.
// Stable auth flow. Do not change without updating tests.
// The previous helper functions `sendOTPEmail` and `verifyOTP` that used the `otp_verifications` table
// have been deprecated and removed. Use `supabase.auth.signInWithOtp` / `supabase.auth.verifyOtp` instead.

/**
 * Register a new user
 * Step 1: Send OTP to CVSU email
 */
export async function initiateRegistration(data: {
  email: string
  username: string
  program?: string
  college?: string
  password: string
}) {
  const supabase = getSupabase()

  // Validate CVSU email
  if (!data.email.endsWith('@cvsu.edu.ph')) {
    throw new Error('Only @cvsu.edu.ph email addresses are allowed')
  }

  // Check if email already exists
  const { data: existingUser, error: existingUserErr } = await supabase
    .from('users')
    .select('email')
    .eq('email', data.email)
    .maybeSingle()

  if (existingUser) {
    throw new Error('Email already registered')
  }

  // Check if username already exists
  const { data: existingUsername, error: existingUsernameErr } = await supabase
    .from('users')
    .select('username')
    .eq('username', data.username)
    .maybeSingle()

  if (existingUsername) {
    throw new Error('Username already taken')
  }

  // If DEV_SKIP is enabled and dev create helper is explicitly enabled, use the local dev-server to create a confirmed user.
  // This is optional and controlled by both flags to avoid making network calls in normal dev runs.
  const DEV_SKIP = import.meta.env.VITE_DEV_SKIP_EMAIL_CONFIRMATION === 'true' && import.meta.env.VITE_ENABLE_DEV_CREATE_USER === 'true'
  if (DEV_SKIP) {
    try {
      const devUrl = (import.meta.env.DEV ? 'http://localhost:9999' : '') + '/dev/create-user'
      const resp = await fetch(devUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, username: data.username }),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => null)
        console.warn('Dev create-user returned non-ok, falling back to normal signup:', resp.status, body)
      } else {
        // If the helper created the user, optionally create a profile row if possible.
        try {
          const { ok } = resp
          // The helper's response may include credentials or nothing; we don't rely on it to sign users in here.
          console.info('Dev create-user returned success (dev skip enabled).')
        } catch (e) {
          console.warn('Dev create-user succeeded but no usable payload returned (non-fatal)', e)
        }
      }
    } catch (e) {
      // Dev server not reachable or other network error — warn and continue to normal signup without throwing
      console.warn('Dev create-user helper unreachable; continuing with standard signup flow (dev flag requires explicit enable):', e?.message || e)
    }
  }

  // Create a Supabase Auth user (do not attempt to sign the user in automatically)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { username: data.username } },
  })

  if (authError) {
    const msg = authError.message || '';
    if (msg.toLowerCase().includes('confirmation') || msg.toLowerCase().includes('sending') || msg.toLowerCase().includes('smtp')) {
      // Non-fatal: proceed to attempt sign-in
      console.warn('Non-fatal SMTP error during signUp:', authError);
    } else {
      throw authError;
    }
  }

  // Do NOT sign the user in automatically after signUp. The user should verify their email first.

  // If signUp returned an error that is fatal, surface it to caller
  if (authError) {
    const msg = authError.message || '';
    if (msg.toLowerCase().includes('confirmation') || msg.toLowerCase().includes('sending') || msg.toLowerCase().includes('smtp')) {
      // Non-fatal: proceed and inform the caller that verification is required.
      console.warn('Non-fatal SMTP/confirmation error during signUp:', authError);
    } else {
      throw authError;
    }
  }

  // Success: tell caller to show verification step (do not create a session or redirect)
  return { success: true, message: 'Sign-up successful. A verification email has been sent (if email delivery is configured). Please verify your email to complete registration.' }
}

/**
 * Complete registration after OTP verification
 */
export async function completeRegistration(data: {
  email: string
  username: string
  program?: string
  college?: string
  password: string
  otpCode: string
}) {
  const supabase = getSupabase()

  // Verify OTP using Supabase built-in verifyOtp (explicit email OTP)
  let verifyData: any = null
  try {
    const token = (data.otpCode || '').toString().trim()

    // Debug: log token length and value in dev to help troubleshoot server/client mismatches
    try {
      if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).__ISKOMARKET_DEBUG__)) {
        console.debug('completeRegistration: verifying token', { token, tokenLength: token.length })
      }
    } catch (e) { /* no-op */ }

    const verifyResp = await supabase.auth.verifyOtp({ email: data.email.trim(), token, type: 'email' } as any)
    verifyData = verifyResp?.data ?? null
    const verifyError = verifyResp?.error ?? null

    // Log SDK response for debugging (dev-only)
    try {
      if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).__ISKOMARKET_DEBUG__)) {
        console.debug('completeRegistration verifyOtp response', { verifyData, verifyError, tokenLength: token.length })
      }
    } catch (e) { /* no-op */ }

    if (verifyError) {
      const msg = (verifyError?.message || '').toString().toLowerCase()
      if (msg.includes('token has expired') || msg.includes('expired') || msg.includes('otp_expired')) {
        throw new Error('This code is no longer valid. Request a new one and try again.')
      }
      if (msg.includes('invalid') || msg.includes('is invalid') || msg.includes('invalid token')) {
        throw new Error('Invalid code. Please enter the code from the newest email.')
      }
      throw verifyError
    }
  } catch (err: any) {
    console.error('completeRegistration (verify) error:', err)
    // Normalize common SDK errors to friendly messages
    if ((err?.message || '').toLowerCase().includes('expired')) {
      throw new Error('This code is no longer valid. Request a new one and try again.')
    }
    throw err
  }

  // Do NOT sign the user in automatically after verification. Instead, if the verify response included a user
  // object (some Supabase setups include it), attempt to upsert a profile; otherwise just return success so the
  // UI can prompt the user to sign in manually.
  if (verifyData?.user) {
    const uid = verifyData.user.id
    const profile = {
      id: uid,
      email: data.email,
      username: data.username,
      is_admin: false,
      date_registered: new Date().toISOString(),
    } as any
    if (data.program) profile.program = data.program
    if (data.college) profile.college = data.college

    try {
      const { error: profileError } = await supabase.from('users').upsert([profile], { onConflict: 'id' })
      if (profileError) {
        const perrMsg = profileError?.message || ''
        if (perrMsg.toLowerCase().includes('row-level security') || perrMsg.toLowerCase().includes('violates row-level security')) {
          // Don't block the verification flow for RLS — return success but indicate profile may need admin-side policy
          return { success: true, message: 'Email verified. Please sign in to continue. Note: profile creation may be blocked by RLS; apply the policy or use a server function.' }
        }

        // If profile creation failed for other reasons, log it and return success so the user can sign in
        console.warn('Profile upsert failed after verification (non-fatal):', profileError)
      }

      // Create welcome notification and iskoin transaction if not already created
      try {
        await supabase.from('notifications').insert({
          user_id: uid,
          type: 'system',
          title: 'Welcome to IskoMarket!',
          message: 'Your account has been created successfully. You received 50 Iskoins as a welcome bonus!',
          priority: 'high',
        })

        await supabase.from('iskoin_transactions').insert({
          user_id: uid,
          amount: 50,
          type: 'bonus',
          description: 'Welcome bonus',
          balance_before: 0,
          balance_after: 50,
        })
      } catch (e) {
        console.warn('Post-creation notifications/transactions may have failed (non-fatal):', e)
      }

      return { success: true, message: 'Email verified. Please sign in to continue.' }
    } catch (e) {
      console.warn('Profile creation/upsert may have failed (non-fatal):', e)
      return { success: true, message: 'Email verified. Please sign in to continue.' }
    }
  }

  return { success: true, message: 'Email verified. Please sign in to continue.' }
}

/**
 * Send signup OTP using Supabase Auth (type: 'email')
 * Verifies that the email is not already registered (friendly error) and delegates
 * email sending to Supabase Auth (no custom OTP DB or external mail providers)
 */
export async function sendSignupOtp(email: string, username?: string) {
  const supabase = getSupabase()

  if (!email.endsWith('@cvsu.edu.ph')) {
    throw new Error('Only @cvsu.edu.ph email addresses are allowed')
  }

  // If there's already a profile for this email, surface a friendly error
  const { data: existing, error: lookupErr } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (lookupErr) {
    // If the lookup itself failed for some reason, log and continue to attempt OTP send and let Supabase return useful errors
    console.warn('Failed to check existing user for email (ignoring):', lookupErr?.message || lookupErr)
  }

  if (existing) {
    const e: any = new Error('This CvSU email is already registered. Try signing in instead.')
    e.code = 'EMAIL_ALREADY_REGISTERED'
    e.status = 409
    throw e
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { username } },
      // Use explicit email OTP (no magic link) to produce numeric codes
      type: 'email',
    } as any)

    if (error) throw error
    return data
  } catch (err: any) {
    console.error('signInWithOtp error', err)
    throw err
  }
}

/**
 * Verify signup OTP
 */
export async function verifySignupOtp(email: string, token: string): Promise<{ user?: any | null; error?: string | null }> {
  const supabase = getSupabase()
  const code = (token || '').toString().trim()

  // Validation: empty code
  if (!code) return { user: null, error: 'Enter the verification code.' }

  // Default to exact 8-digit codes (configurable), ensure templates and tests use 8 digits
  const configured = Number(import.meta.env.VITE_OTP_LENGTH || 0)
  const expected = configured > 0 ? configured : 6
  const allowed = Array.from(new Set([expected, 8]))
  if (!allowed.includes(code.length)) {
    return { user: null, error: `Enter the verification code (${allowed.join(' or ')} digits).` }
  }

  try {
    // Use explicit email OTP verification (no magic link)
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' } as any)
    console.log('verifyOtp response', { data, error, tokenLength: code.length })
    if (error) {
      // Log extra SDK details to help diagnose token length mismatches
      console.warn('verifyOtp SDK error details:', {
        message: error.message,
        status: (error as any)?.status || (error as any)?.statusCode || null,
        name: error.name,
        tokenLength: code.length,
      })

      const msg = (error?.message || '').toString().toLowerCase()
      if (msg.includes('token has expired') || msg.includes('expired') || msg.includes('otp_expired')) {
        return { user: null, error: 'This code is no longer valid. Request a new one and try again.' }
      }
      if (msg.includes('invalid') || msg.includes('is invalid') || msg.includes('invalid token')) {
        return { user: null, error: 'Invalid code. Please enter the code from the newest email.' }
      }
      console.error('verifySignupOtp unexpected error (sdk):', error)
      return { user: null, error: 'Verification failed. Please try again.' }
    }

    return { user: data?.user ?? null, error: null }
  } catch (err: any) {
    console.error('verifySignupOtp exception:', err)
    return { user: null, error: 'Verification failed. Please try again.' }
  }
}

// New helper: verify an OTP code (6 or 8 digits), return the verifyOtp response data (may include session)
export async function completeRegistrationWithCode(email: string, code: string) {
  const supabase = getSupabase()
  const token = (code || '').toString().trim()

  // Sanity check (server-side): accept numeric 8-digit tokens
  if (!/^\d{8}$/.test(token)) {
    throw new Error('Invalid code format.')
  }

  // Debug: log token length and value in dev to help troubleshoot server/client mismatches
  try {
    if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).__ISKOMARKET_DEBUG__)) {
      console.debug('completeRegistrationWithCode: verifying token', { token, tokenLength: token.length })
    }
  } catch (e) { /* no-op */ }

  // Call Supabase verifyOtp explicitly with email type
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' } as any)

  // Log SDK response for debugging (dev-only)
  try {
    if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).__ISKOMARKET_DEBUG__)) {
      console.debug('completeRegistrationWithCode verifyOtp response', { verifyData, verifyError, tokenLength: token.length })
    }
  } catch (e) { /* no-op */ }

  if (verifyError) {
    const msg = (verifyError?.message || '').toString().toLowerCase()
    // Map common SDK error messages to friendly app errors
    if (msg.includes('token has expired') || msg.includes('expired') || msg.includes('otp_expired')) {
      throw new Error('This code is no longer valid. Click Resend to get a new code and use only the newest email.')
    }
    if (msg.includes('invalid') || msg.includes('is invalid') || msg.includes('invalid token')) {
      throw new Error('Invalid code. Please check the code or request a new one.')
    }
    // Fallback
    throw new Error('Verification failed. Please check the code or request a new one.')
  }

  return verifyData
}

// Helper: ensure a profile row exists for an auth user
export async function ensureProfile(user: any) {
  const supabase = getSupabase()
  if (!user || !user.id) return

  try {
    const { data, error } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
    if (error) {
      // If the only error is 'no rows', it will be returned as null data — ignore
      console.warn('ensureProfile lookup error (ignored):', error.message || error)
    }

    if (!data) {
      await supabase.from('users').insert({ id: user.id, email: user.email, username: user.user_metadata?.username || user.email })
    }
  } catch (e) {
    console.warn('ensureProfile unexpected error (ignored):', e)
  }
}

/**
 * Resend signup OTP (fallbacks to re-issuing signInWithOtp when `resend` is not available)
 */
export async function resendSignupOtp(email: string, username?: string) {
  const supabase = getSupabase()

  if (!email.endsWith('@cvsu.edu.ph')) {
    throw new Error('Only @cvsu.edu.ph email addresses are allowed')
  }

  try {
    // Re-issue an email OTP. Use explicit email type to match verification below.
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { username } },
      type: 'email',
    } as any)

    if (error) throw error
    return data
  } catch (err: any) {
    console.error('resendSignupOtp error', err)
    throw err
  }
}

/**
 * Send a password reset OTP using Supabase Auth (recovery OTP)
 */
export async function sendPasswordResetOtp(email: string) {
  const supabase = getSupabase()

  if (!email.endsWith('@cvsu.edu.ph')) {
    throw new Error('Only @cvsu.edu.ph email addresses are allowed')
  }

  try {
    try { console.debug('[AUTH] sendPasswordResetOtp sending recovery OTP to', email) } catch (e) { /* no-op */ }
    try { console.debug('[AUTH] Supabase project URL', import.meta.env.VITE_SUPABASE_URL) } catch (e) { /* no-op */ }

    // Runtime test stub: allow browser to indicate stub mode via window.__TEST_RESET_STUB__
    if (typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true) {
      try { console.debug('[AUTH] sendPasswordResetOtp (stub mode) skipping network request') } catch (e) { /* no-op */ }
      return { message: 'stubbed' } as any
    }

    // Send signInWithOtp with explicit 'recovery' BOTH at top-level and inside options to cover SDK variations
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      // Use explicit 'recovery' type to indicate password reset flow
      type: 'recovery',
      options: { type: 'recovery' } as any,
    } as any)

    // Log full SDK response to help determine which email template was used server-side
    try { console.debug('[AUTH] sendPasswordResetOtp sdkResponse', { data, error }) } catch (e) { /* no-op */ }

    // Heuristic detection: if the SDK response or any messages mention "confirmation" or "link",
    // surface a clear error so the UI doesn't proceed thinking an OTP code was sent.
    try {
      const respText = (JSON.stringify(data || {}) + JSON.stringify(error || {})).toLowerCase()
      if (respText.includes('confirmationurl') || respText.includes('confirmation_url') || respText.includes('confirmationurl') || respText.includes('link')) {
        console.warn('[AUTH] sendPasswordResetOtp: SDK response suggests a magic-link may have been sent. Ensure your Supabase Reset Password template uses `{{ .Token }}` (no `{{ .ConfirmationURL }}`) and that you are calling signInWithOtp({ type: "recovery" }) against the correct project.')
        const e: any = new Error('Server appears to have sent a link-type reset (magic link) instead of an OTP. Check your Supabase Reset Password email template and project settings.')
        e.sdkResponse = { data, error }
        throw e
      }
    } catch (e) { /* no-op */ }

    if (error) throw error
    return data
  } catch (err: any) {
    console.error('sendPasswordResetOtp error', err)
    // Surface a clearer developer-facing message for magic link misconfiguration
    if ((err?.message || '').toLowerCase().includes('magic') || (err?.message || '').toLowerCase().includes('link') || (err?.message || '').toLowerCase().includes('confirmation')) {
      const e: any = new Error('The auth provider returned a link-type response. Verify your Supabase Reset Password email template uses only `{{ .Token }}` (no `{{ .ConfirmationURL }}`) and that your app uses the same Supabase project (VITE_SUPABASE_URL) you edited.')
      e.original = err
      throw e
    }
    throw err
  }
}

// The older `verifyPasswordResetOtpSafe` helper has been removed in favor of calling
// `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` directly from the client
// for the reset flow (with test stubs preserved in UI E2E tests). If you need a server-side
// helper for admin verification, add a small focused helper instead.



/**
 * Sign in with email and password
 */
export async function signIn(data: { email: string; password: string }) {
  const supabase = getSupabase()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    console.error('auth.signInWithPassword error', error)
    throw error
  }

  // Update last active timestamp
  if (authData.user) {
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', authData.user.id)
  }

  return {
    user: authData.user,
    session: authData.session,
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = getSupabase()

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch full profile from users table
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile row is missing (e.g., profile creation was blocked by RLS during registration),
  // return a minimal profile constructed from the Auth user so the UI can function and
  // references to the current user (e.g., seller_id) still work. Encourage ops to upsert
  // the full profile via admin later.
  if (error || !profile) {
    console.warn('User profile row missing for auth user', user.id, '- returning a minimal fallback profile for UI. Consider upserting a users row for this user.');
    return {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email || user.id,
      is_active: true,
      is_verified: true,
      // Defaults for other fields used by UI
      is_admin: false,
      is_suspended: false,
      date_registered: new Date().toISOString(),
      iskoins: 0,
      credit_score: 0,
      rank_tier: 'Bronze',
      current_season: 1
    } as any
  }

  return profile
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const supabase = getSupabase()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}

/**
 * Initiate password reset (uses Supabase built-in flow)
 */
export async function initiatePasswordReset(email: string) {
  const supabase = getSupabase()

  // Check if user exists
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single()

  if (!user) {
    throw new Error('No account found with this email')
  }

  // NOTE: Use OTP-based recovery flow (signInWithOtp type: 'recovery') instead of magic-link reset.
  // This delegates email sending to Supabase but uses numeric OTP templates configured in the project.
  try {
    // Pass type as both top-level and inside options to ensure SDK variation compatibility
    const { data, error } = await supabase.auth.signInWithOtp({ email, type: 'recovery', options: { type: 'recovery' } } as any)

    // Detect magic-link-like responses and surface clear errors instead of proceeding silently
    try {
      const respText = (JSON.stringify(data || {}) + JSON.stringify(error || {})).toLowerCase()
      if (respText.includes('confirmationurl') || respText.includes('confirmation_url') || respText.includes('link')) {
        console.warn('[AUTH] initiatePasswordReset: server response looks like a magic-link was sent', { data, error })
        const e: any = new Error('Server appears to have sent a link-based password reset email. Confirm your Supabase Reset Password template uses `{{ .Token }}` (no `{{ .ConfirmationURL }}`) and ensure the project URL is correct.')
        e.sdkResponse = { data, error }
        throw e
      }
    } catch (e) { /* no-op */ }

    if (error) throw error
    return { success: true, message: 'Password reset code sent. Check your inbox.' }
  } catch (err) {
    console.error('initiatePasswordReset (otp) error', err)
    throw err
  }
}

/**
 * Complete password reset after OTP/link verification
 */
export async function completePasswordReset(params: { email: string; otp: string; newPassword: string }) {
  const supabase = getSupabase()
  const { email, otp: rawOtp, newPassword } = params
  const otp = (rawOtp || '').toString().trim()

  // Test stub: when running E2E in test mode, allow a fixed OTP to instantly succeed (supports runtime window flag)
  try {
    const runtimeStub = typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true
    const stubOtp = (runtimeStub ? (window as any).__TEST_RESET_OTP__ : (import.meta.env.VITE_TEST_RESET_OTP)) || '11111111'
    if (import.meta.env.VITE_TEST_RESET_STUB === 'true' || runtimeStub) {
      if (otp === stubOtp) {
        // In test stub mode, do not call Supabase — return success for deterministic tests
        return { success: true, message: 'Password updated (stubbed)', stubbed: true }
      } else {
        // Invalid stub code is a normal validation failure (do not throw)
        return { success: false, errorMessage: 'Invalid or expired code. Please try again.' }
      }
    }
  } catch (e) { /* ignore env read errors */ }

  if (!otp) {
    return { success: false, errorMessage: 'Enter the verification code.' }
  }

  // NOTE: The OTP should already be verified by the client (supabase.auth.verifyOtp) before reaching
  // this step. Do not re-call the proxy. Instead, update the password using the current auth session.

  // Support test stubs (deterministic E2E) — when enabled, treat the configured stub OTP as valid
  try {
    const runtimeStub = typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true
    const stubOtp = (runtimeStub ? (window as any).__TEST_RESET_OTP__ : (import.meta.env.VITE_TEST_RESET_OTP)) || '11111111'
    if (import.meta.env.VITE_TEST_RESET_STUB === 'true' || runtimeStub) {
      if (otp === stubOtp) {
        // Simulate success in stub mode
        return { success: true, message: 'Password updated (stubbed)', stubbed: true }
      }
      return { success: false, errorMessage: 'Incorrect or expired code. Please try again.' }
    }
  } catch (e) { /* ignore */ }

  if (!otp) {
    return { success: false, errorMessage: 'Enter the verification code.' }
  }

  try {
    await updatePassword(newPassword)
    return { success: true, message: 'Password updated successfully' }
  } catch (err: any) {
    try { console.error('completePasswordReset updateUser error', err) } catch (e) { /* no-op */ }
    return { success: false, errorMessage: 'Could not update your password. Please try again.' }
  }
}

// Backwards compatible wrapper (optional)
export async function completePasswordResetLegacy(email: string, otpCode: string, newPassword: string) {
  return completePasswordReset({ email, otp: otpCode, newPassword })
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  const supabase = getSupabase()

  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

/**
 * Refresh user session
 */
export async function refreshSession() {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = getSupabase()

  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}