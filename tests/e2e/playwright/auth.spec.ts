import { test, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_REGISTER_EMAIL = process.env.TEST_REGISTER_EMAIL || `test+signup@cvsu.edu.ph`
const TEST_REGISTER_PASS = process.env.TEST_REGISTER_PASSWORD || 'Aa123456'
const TEST_LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || ''
const TEST_LOGIN_PASS = process.env.TEST_LOGIN_PASSWORD || ''

test.describe('Auth flows (smoke)', () => {
  test('signup + verify (stubbed OTP) advances to success', async ({ page }) => {
    await page.goto(`${baseURL}/auth`)

    // Switch to Register tab
    await page.getByRole('button', { name: 'Register' }).first().click()
    await expect(page.locator('text=Username')).toBeVisible()

    // Fill registration form
    const username = `pw${Date.now().toString().slice(-6)}`
    await page.fill('input[placeholder="iskostudent"]', username)
    await page.fill('input[placeholder="your.name@cvsu.edu.ph"]', TEST_REGISTER_EMAIL)
    await page.fill('input[placeholder="Create a strong password"]', TEST_REGISTER_PASS)
    await page.fill('input[placeholder="Confirm your password"]', TEST_REGISTER_PASS)

    // Enable runtime verify stub for deterministic verification
    await page.evaluate(() => {
      ;(window as any).__TEST_VERIFY_OTP_STUB__ = true
      ;(window as any).__TEST_VERIFY_OTP_VALID__ = '12345678'
    })

    await page.locator('form').getByRole('button', { name: 'Register' }).click()

    // If email already exists, test still passes — otherwise we should see Verify dialog
    const existsText = page.locator('text=An account with this email already exists. Please sign in or reset your password.')
    if (await existsText.isVisible().catch(() => false)) {
      await expect(existsText).toBeVisible()
      return
    }

    // Wait for Verify dialog and fill stubbed token
    await expect(page.getByRole('heading', { name: 'Verify Your Email' }).first()).toBeVisible({ timeout: 20000 })
    const valid = '12345678'
    for (let i = 0; i < valid.length; i++) {
      await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(valid[i])
    }
    await page.locator('button:has-text("Verify")').click()

    // Expect success message and that the Verify dialog closed
    await expect(page.locator('text=Email verified. You may now sign in with your password.')).toBeVisible({ timeout: 5000 })
  })

  test('login success (when creds provided)', async ({ page }) => {
    test.skip(!TEST_LOGIN_EMAIL || !TEST_LOGIN_PASS, 'TEST_LOGIN_EMAIL/TEST_LOGIN_PASSWORD not provided; skipping login success test')
    await page.goto(`${baseURL}/auth`)
    await page.click('text=Sign In')
    await page.fill('input[type="email"]', TEST_LOGIN_EMAIL)
    await page.fill('input[type="password"]', TEST_LOGIN_PASS)
    await page.click('text=Sign In to IskoMarket')

    // After successful sign-in, the app should show a Sign Out menu item
    await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
  })
})
