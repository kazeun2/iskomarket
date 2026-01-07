// Stable auth flow. Do not change without updating tests.
import React, { useState } from 'react'
import { Dialog } from './ui/dialog'
import { toast } from 'sonner'
import { resendSignupOtp, ensureProfile } from '@/auth'
import { getSupabase } from '@/lib/supabaseClient'
import { clearModalLocks } from '@/lib/modal'
import { useOptionalOverlayManager } from '@/contexts/OverlayManager'
import { DialogContent } from './ui/dialog'

interface VerifyEmailProps {
  open?: boolean
  email: string
  username: string
  password: string
  onCancel: () => void
  onVerified: (user: any) => void
  resendCooldown: number
  setResendCooldown: (value: number) => void
}

import { OtpVerifyModal } from './OtpVerifyModal'

export function VerifyEmail({ open = true, email, username, password, onCancel, onVerified, resendCooldown, setResendCooldown }: VerifyEmailProps) {
  // Reuse the generic OTP modal for registration verification
  const handleVerify = async (code: string) => {
    const supabase = getSupabase()
    const token = (code || '').toString().trim()

    // Test-stub support for deterministic E2E
    try {
      const runtimeStub = typeof window !== 'undefined' && (window as any).__TEST_VERIFY_OTP_STUB__ === true
      const buildStub = import.meta.env.VITE_TEST_VERIFY_OTP_STUB === 'true' || import.meta.env.VITE_TEST_RESET_STUB === 'true'
      const stubValid = (typeof window !== 'undefined' && (window as any).__TEST_VERIFY_OTP_VALID__) || (import.meta.env.VITE_TEST_VERIFY_OTP_VALID) || '123456'
      if (buildStub || runtimeStub) {
        if (token === (stubValid || '').toString()) {
          toast.success('Email verified. You may now sign in with your password.')
          try { overlayManager?.hide?.() } catch (e) {}
          try { clearModalLocks() } catch (e) {}
          onVerified(null)
          return { status: 'ok' }
        }
        return { status: 'invalid', message: 'Incorrect or expired code. Please try again.' }
      }
    } catch (e) { /* ignore stub detection errors */ }

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' } as any)

      if (verifyError) {
        const msg = (verifyError?.message || '').toString().toLowerCase()
        if (msg.includes('token has expired') || msg.includes('expired') || msg.includes('otp_expired')) {
          return { status: 'invalid', message: 'This code is no longer valid. Click Resend to get a new code and use only the newest email.' }
        }
        if (msg.includes('invalid') || msg.includes('is invalid') || msg.includes('invalid token')) {
          return { status: 'invalid', message: 'Invalid code. Please check the code or request a new one.' }
        }

        // Other errors are considered fatal
        return { status: 'fatal', message: 'Verification failed. Please try again later.' }
      }

      const session = verifyData?.session ?? null
      const user = verifyData?.user ?? (session ? session.user : null)

      // try ensureProfile but don't block
      if (user) {
        try { await ensureProfile(user) } catch (e) { console.warn('ensureProfile failed (non-fatal):', e) }
      }

      // success
      toast.success('Email verified. You may now sign in with your password.')
      try { overlayManager?.hide?.() } catch (e) {}
      try { clearModalLocks() } catch (e) {}
      onVerified(user ?? null)
      return { status: 'ok' }
    } catch (err: any) {
      console.error('VerifyEmail verify error', err)
      return { status: 'fatal', message: 'Verification failed. Please try again later.' }
    }
  }

  const handleResend = async () => {
    await resendSignupOtp(email, username)
  }

  const overlayManager = useOptionalOverlayManager()

  return (
    <OtpVerifyModal
      open={open}
      title="Verify Your Email"
      description="Enter the exact numeric code from the most recent email we sent to your CvSU inbox. If you requested a new code, only the newest email will work."
      email={email}
      codeLength={Number(import.meta.env.VITE_OTP_LENGTH || 8)}
      resendCooldown={resendCooldown}
      setResendCooldown={setResendCooldown}
      onCancel={onCancel}
      onVerify={handleVerify}
      onResend={handleResend}
    />
  )
}
