import { test, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_EMAIL = process.env.TEST_RESET_EMAIL
if (!TEST_EMAIL) {
  console.warn('TEST_RESET_EMAIL not provided — skipping reset UI test.')
}

test.describe('Forgot Password UI - /auth reset flow', () => {
  test('requests a password reset email and shows confirmation', async ({ page }) => {
    // Forward page console to test output
    page.on('console', (msg) => console.log('[PAGE]', msg.type(), msg.text()))

    await page.goto(`${baseURL}/auth`)

    // Open "Forgot your password?" flow
    await page.locator('button:has-text("Forgot your password?")').click()

    // Wait for the forgot password form to appear
    await expect(page.locator('text=Reset Your Password')).toBeVisible()

    // Skip if TEST_RESET_EMAIL not provided
    test.skip(!TEST_EMAIL, 'TEST_RESET_EMAIL not provided; skipping this test')

    // Fill the email
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill(TEST_EMAIL)

    // Buttons should be visible
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
    await expect(page.locator('button:has-text("Send Code")')).toBeVisible()

    // Click Send Code to trigger OTP-based reset
    await page.locator('button:has-text("Send Code")').click()

    // Expect a success message / UI that indicates an OTP was sent and the OTP modal opens
    await expect(page.locator('text=Verification code sent for password reset').first()).toBeVisible({ timeout: 5000 })
    // OTP modal should be visible
    await expect(page.locator('text=Code sent to:')).toBeVisible()
  })
})
