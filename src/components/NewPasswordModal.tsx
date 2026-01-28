// Stable auth flow. Do not change without updating tests.
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { toast } from 'sonner'
import { updatePassword } from '@/auth'

interface NewPasswordModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
  email: string
  otp: string | null
}

export function NewPasswordModal({ open, onCancel, onSuccess, email, otp }: NewPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (pw: string) => {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)
  }

  const handleConfirm = async (): Promise<void> => {
    setError('')
    if (!otp) {
      setError('No verification code available. Please verify your email code first.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number')
      return
    }

    setIsLoading(true)
    try {
      // Support test stub mode: accept configured stub OTP without calling Supabase
      try { console.debug('[RESET] completing password reset for', email, 'otpLen=', (otp || '').toString().length) } catch (e) { /* no-op */ }
      const runtimeStub = typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true
      const stubOtp = (runtimeStub ? (window as any).__TEST_RESET_OTP__ : (import.meta.env.VITE_TEST_RESET_OTP)) || '11111111'
      if (import.meta.env.VITE_TEST_RESET_STUB === 'true' || runtimeStub) {
        if (otp === stubOtp) {
          toast.success('Password updated. Please log in with your new credentials.')
          onSuccess()
          return
        }
        setError('Incorrect or expired code. Please try again.')
        return
      }

      // Otherwise update password using the current authenticated session
      await updatePassword(newPassword)

      toast.success('Password updated. Please log in with your new credentials.')
      onSuccess()
      return
    } catch (err: any) {
      try { console.error('Complete password reset unexpected error', err) } catch (e) { /* no-op */ }
      // Map SDK errors to friendly messages when possible
      if (err?.message && /invalid|expired|forbidden/i.test(err.message)) {
        setError('Incorrect or expired code. Please try again.')
      } else {
        setError('Failed to update password. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent data-testid="new-password-modal" className="w-full max-w-md rounded-lg bg-card border border-gray-200 shadow-xl text-gray-900">
        <DialogHeader>
          <DialogTitle>Set a New Password</DialogTitle>
          <DialogDescription>Enter a new password for your account and confirm it to complete the reset.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm mb-2">New password</label>
            <input aria-label="New password" className="w-full rounded-md border border-gray-300 px-3 py-2" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-2">Confirm new password</label>
            <input aria-label="Confirm new password" className="w-full rounded-md border border-gray-300 px-3 py-2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2 mt-2">
            <button onClick={onCancel} className="flex-1 rounded-md border border-gray-300 bg-card py-2">Cancel</button>
            <button onClick={handleConfirm} disabled={isLoading} className="flex-1 rounded-md bg-green-600 text-foreground py-2">{isLoading ? 'Saving…' : 'Confirm'}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
