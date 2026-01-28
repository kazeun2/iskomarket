import { test, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_EMAIL = process.env.TEST_RESET_EMAIL || 'test+reset@cvsu.edu.ph'

// This test ensures the browser does not make a direct call to Supabase's /auth/v1/verify
// endpoint and instead uses the server-side proxy (or local dev-server proxy) to avoid
// the browser showing a red 403 in DevTools for invalid OTP verification.

test('invalid OTP via server proxy does not create console 403 noise', async ({ page }) => {
  await page.goto(`${baseURL}/auth`)

  // Enable runtime send stub so we don't attempt to send a real email
  await page.evaluate(() => {
    ;(window as any).__TEST_RESET_STUB__ = true
    ;(window as any).__TEST_RESET_OTP__ = '12345678'
    // Intentionally DO NOT enable __TEST_VERIFY_OTP_STUB__ so the app uses the proxy
  })

  // Collect console errors
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // Open forgot flow and send code
  await page.locator('button:has-text("Forgot your password?")').click()
  await expect(page.locator('text=Reset Your Password')).toBeVisible()
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('button:has-text("Send Code")').click()

  // Wait for OTP modal inputs
  await page.locator('input[aria-label="Digit 1"]').waitFor({ timeout: 5000 })

  // Fill an invalid OTP so the proxy returns invalid
  const invalid = '00000000'
  for (let i = 0; i < invalid.length; i++) {
    await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(invalid[i])
  }

  // Click verify
  await page.locator('[data-testid="otp-verify-button"]').click()

  // Expect error message visible in the modal
  const err = page.locator('[data-testid="otp-error"]')
  await expect(err).toBeVisible({ timeout: 5000 })
  await expect(err).toContainText(/Incorrect or expired code|Invalid or expired code/)

  // Confirm no unhandled/uncaught console errors indicating a direct 403 to Supabase
  expect(errors.every(e => !/https:\/\/.+supabase.+\/auth\/v1\/verify|403 \(Forbidden\)/i.test(e))).toBe(true)
})