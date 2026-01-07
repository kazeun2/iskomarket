import { test, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_EMAIL = process.env.TEST_RESET_EMAIL || 'test+reset@cvsu.edu.ph'

test.describe('Forgot Password - invalid OTP behavior', () => {
  test('invalid OTP keeps modal open and shows friendly error', async ({ page }) => {
    // Enable runtime test stubs in the browser for deterministic behavior
    await page.goto(`${baseURL}/auth`)

    // Set runtime stubs: skip real email sending and make verifyOtp deterministic
    await page.evaluate(() => {
      ;(window as any).__TEST_RESET_STUB__ = true
      ;(window as any).__TEST_RESET_OTP__ = '12345678' // valid if needed
      ;(window as any).__TEST_VERIFY_OTP_STUB__ = true
      ;(window as any).__TEST_VERIFY_OTP_INVALID__ = '00000000'
      ;(window as any).__TEST_VERIFY_OTP_VALID__ = '12345678'
    })

    // Open forgot flow
    await page.locator('button:has-text("Forgot your password?")').click()
    await expect(page.locator('text=Reset Your Password')).toBeVisible()

    // Fill email and click Send Code
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('button:has-text("Send Code")').click()

    // Wait for OTP modal inputs
    await page.locator('input[aria-label="Digit 1"]').waitFor({ timeout: 5000 })

    // Fill invalid OTP: 00000000
    const invalid = '00000000'
    for (let i = 0; i < invalid.length; i++) {
      await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(invalid[i])
    }

    // Listen for console errors (there should be none unexpected during handled failure)
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // Click verify
    await page.locator('[data-testid="otp-verify-button"]').click()

    // Expect error message visible in the modal
    const err = page.locator('[data-testid="otp-error"]')
    await expect(err).toBeVisible({ timeout: 5000 })
    await expect(err).toContainText(/Incorrect or expired code|Invalid or expired code/)

    // Confirm the New Password modal did not open
    await expect(page.locator('[data-testid="new-password-modal"]')).toBeHidden()

    // Console errors may contain expected messages from the auth library (e.g. token invalid). Ensure there are
    // no unhandled/uncaught exceptions (relaxed check for E2E stability).
    expect(errors.every(e => !/unhandled|uncaught/i.test(e))).toBe(true)

    // Also ensure the browser did not log a direct Supabase verify POST (no visible /auth/v1/verify errors)
    expect(errors.every(e => !/\/auth\/v1\/verify/i.test(e))).toBe(true)
  })

  test('valid OTP advances to Set New Password', async ({ page }) => {
    await page.goto(`${baseURL}/auth`)
    await page.evaluate(() => {
      ;(window as any).__TEST_RESET_STUB__ = true
      ;(window as any).__TEST_RESET_OTP__ = '12345678'
      ;(window as any).__TEST_VERIFY_OTP_STUB__ = true
      ;(window as any).__TEST_VERIFY_OTP_VALID__ = '12345678'
    })

    await page.locator('button:has-text("Forgot your password?")').click()
    await expect(page.locator('text=Reset Your Password')).toBeVisible()

    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('button:has-text("Send Code")').click()

    await page.locator('input[aria-label="Digit 1"]').waitFor({ timeout: 5000 })

    const valid = '12345678'
    for (let i = 0; i < valid.length; i++) {
      await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(valid[i])
    }

    await page.locator('[data-testid="otp-verify-button"]').click()

    // Expect the Set New Password UI to be visible
    await expect(page.locator('[data-testid="new-password-modal"]')).toBeVisible({ timeout: 5000 })
  })
})
