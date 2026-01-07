import { test, expect } from '@playwright/test'

// NOTE: This test requires setting environment variables when running Playwright:
// VITE_TEST_RESET_STUB=true and VITE_TEST_RESET_OTP=11111111 (or set TEST_RESET_OTP)
const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_EMAIL = process.env.TEST_RESET_EMAIL
if (!TEST_EMAIL) {
  console.warn('TEST_RESET_EMAIL not provided — reset E2E test will skip sending/verification parts unless DEFAULT_TEST_EMAIL is set.')
}  
const TEST_OTP = process.env.TEST_RESET_OTP || '11111111'
const NEW_PASSWORD = 'NewPassw0rd!'

test.describe('Forgot Password - full reset flow (stubbed OTP)', () => {
  test('sends OTP, verifies, sets new password, and shows success', async ({ page }) => {
    test.skip(!process.env.VITE_TEST_RESET_STUB || !TEST_EMAIL, 'VITE_TEST_RESET_STUB not enabled or TEST_RESET_EMAIL not provided; skipping stubbed reset test')

    // Helpful: forward browser console to test output to see page debug logs (e.g., [RESET] and [AUTH] logs)
    page.on('console', (msg) => console.log('[PAGE]', msg.type(), msg.text()))

    await page.goto(`${baseURL}/auth`)

    // Open Forgot flow
    await page.locator('button:has-text("Forgot your password?")').click()

    // Wait for reset card
    await expect(page.locator('text=Reset Your Password')).toBeVisible()

    // Fill email
    await page.locator('input[type="email"]').fill(TEST_EMAIL)

    // Enable runtime test stub in the browser so the app skips network OTP calls
    await page.evaluate((otp) => {
      (window as any).__TEST_RESET_STUB__ = true
      ;(window as any).__TEST_RESET_OTP__ = otp
    }, TEST_OTP)

    // Click Send Code
    await page.locator('button:has-text("Send Code")').click()

    // Expect OTP modal inputs to be ready (wait for first digit input), then verify it shows the right email
    const codeSentParagraph = page.locator('p:has-text("Code sent to:")')
    await page.locator('input[aria-label="Digit 1"]').waitFor({ timeout: 10000 })
    await expect(codeSentParagraph).toBeVisible({ timeout: 5000 })
    await expect(codeSentParagraph).toContainText(TEST_EMAIL)

    // Fill OTP digits (supports 8-digit token)
    for (let i = 0; i < TEST_OTP.length; i++) {
      await page.locator(`input[aria-label="Digit ${i + 1}"]`).fill(TEST_OTP[i])
    }

    // Click Verify on OTP modal
    await page.locator('button:has-text("Verify")').click()

    // New Password modal should appear
    await expect(page.locator('text=Set a New Password')).toBeVisible()

    // Wait for inputs and fill new password and confirm (use input selectors)
    await expect(page.locator('input[aria-label="New password"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[aria-label="Confirm new password"]')).toBeVisible({ timeout: 5000 })
    await page.locator('input[aria-label="New password"]').fill(NEW_PASSWORD)
    await page.locator('input[aria-label="Confirm new password"]').fill(NEW_PASSWORD)

    // Confirm
    await page.locator('button:has-text("Confirm")').click()

    // Expect success: the success toast should appear
    await page.locator('text=Password updated. Please log in with your new credentials.').waitFor({ timeout: 10000 })

    // Now navigate to login. If we're running in stub mode, skip the actual sign-in step as the password change is stubbed
    await page.goto(`${baseURL}/auth`)

    // Wait for login form to show
    await expect(page.locator('text=Sign In').first()).toBeVisible()

    const runtimeStub = process.env.VITE_TEST_RESET_STUB === 'true' || await page.evaluate(() => !!(window as any).__TEST_RESET_STUB__)
    if (!runtimeStub) {
      // Fill login and password and assert successful sign-in when not using the stub
      await page.locator('input[type="email"]').fill(TEST_EMAIL)
      await page.locator('input[placeholder="Enter your password"]').fill(NEW_PASSWORD)
      await page.locator('button[type="submit"]').click()
      // Wait for app to navigate away from /auth (authenticated view)
      await page.waitForURL((url) => !url.pathname?.startsWith('/auth'), { timeout: 8000 })
      // Sanity: assert we have a navigation area that contains Sign Out in the menu
      await expect(page.locator('text=Sign Out').first()).toBeVisible()
    } else {
      // In stub mode, just assert we are back at the Sign In form
      await expect(page.locator('text=Sign In').first()).toBeVisible()
    }
  })
})