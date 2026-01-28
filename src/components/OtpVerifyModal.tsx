// Stable auth flow. Do not change without updating tests.
import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { toast } from 'sonner'

interface OtpVerifyModalProps {
  open: boolean
  title?: string
  description?: string
  email: string
  codeLength?: number // 6 or 8
  resendCooldown: number
  setResendCooldown: (v: number) => void
  onCancel: () => void
  onVerify: (code: string) => Promise<any>
  onResend: () => Promise<any>
}

export function OtpVerifyModal({ open, title = 'Verify', description, email, codeLength = 8, resendCooldown, setResendCooldown, onCancel, onVerify, onResend }: OtpVerifyModalProps) {
  // Accept a configurable codeLength (8-10). Default to 8 unless overridden by caller.
  const len = Math.max(8, Math.min(10, codeLength || 8))
  const [digits, setDigits] = useState<string[]>(Array(len).fill(''))
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!open) {
      setDigits(Array(len).fill(''))
      setError('')
    }
  }, [open, len])

  const focusAt = (i: number) => {
    const ref = inputsRef.current[i]
    if (ref) ref.focus()
  }

  const handleChange = (i: number, value: string) => {
    const v = value.replace(/[^0-9]/g, '').slice(0, 1)
    const next = [...digits]
    next[i] = v
    setDigits(next)
    if (v && i < len - 1) focusAt(i + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      focusAt(i - 1)
    }
  }

  const code = digits.join('')

  const handleVerifyClick = async () => {
    setError('')
    const token = code.trim()
    const re = new RegExp(`^\\d{${len}}$`)
    if (!re.test(token)) {
      setError(`Enter the exact numeric code (${len} digits) from your latest CvSU email.`)
      return
    }

    setIsLoading(true)
    try {
      const res = await onVerify(token)

      // Support new VerifyOtpOutcome shape returned by the auth helper
      if (res && typeof res === 'object') {
        // New outcome type
        if ('status' in res) {
          if (res.status === 'ok') {
            return
          }
          // 'invalid' or 'fatal' -> show message. For 'invalid' do NOT console.error.
          setError(res.message)
          return
        }

        // Backwards compatibility: older handler shape { errorMessage }
        if ('errorMessage' in res && res.errorMessage) {
          setError(res.errorMessage)
          return
        }
      }

      // Unknown shape: show a generic message
      setError('Verification failed. Please try again.')
    } catch (err: any) {
      // Truly unexpected exceptions: log once and show a simple message
      try { console.error('OtpVerifyModal unexpected error', err) } catch (e) { /* no-op */ }
      setError('Verification failed. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Paste handler to support pasting an entire code string
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, len)
    if (pasted.length === len) {
      setDigits(pasted.split(''))
      // focus last input
      const last = inputsRef.current[len - 1]
      if (last) last.focus()
    }
  }

  const handleResendClick = async () => {
    if (resendCooldown > 0) return
    try {
      await onResend()
      setDigits(Array(len).fill(''))
      setError('')
      setResendCooldown(60)
      toast.success('A new code was sent. Use only the newest email.')
    } catch (err: any) {
      console.error('Resend OTP failed', err)
      toast.error(err?.message || 'Could not resend the code. Please try again.')
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="w-full max-w-md rounded-lg bg-card border border-gray-200 shadow-xl text-gray-900">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-4">
          <p className="text-xs text-gray-500 mb-3">Code sent to: <span className="font-medium">{email}</span></p>

          <div className="flex gap-2 justify-center mb-3">
            {Array.from({ length: len }).map((_, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                value={digits[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                maxLength={1}
                data-testid={`otp-digit-${i + 1}`}
                className="w-12 h-12 text-center rounded-md border border-gray-300"
                inputMode="numeric"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <div data-testid="otp-error" className="text-red-600 text-sm mb-2">{error}</div>}

          <div className="flex flex-col gap-2 mt-2">
            <button
              type="button"
              data-testid="otp-verify-button"
              onClick={handleVerifyClick}
              className="w-full rounded-md bg-green-600 text-foreground py-2 font-medium hover:bg-green-700 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying…' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-md border border-gray-300 bg-card py-2 text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleResendClick}
            className="mt-2 text-xs text-green-700 hover:underline"
            disabled={resendCooldown > 0 || isLoading}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Didn’t receive the code? Resend'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
