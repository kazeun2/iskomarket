import { test, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const TEST_EMAIL = process.env.TEST_REGISTER_EMAIL || `hazel.perez@cvsu.edu.ph`

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

test.describe('Registration + Verify flow (UI only)', () => {
  test('sends OTP, opens verify dialog, allows resend and shows error for wrong code', async ({ page }) => {
    // Log page console so we can see Supabase SDK errors
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()))

    await page.goto(`${baseURL}/auth`)

    // Switch to Register tab
    await page.getByRole('button', { name: 'Register' }).first().click()
    await expect(page.locator('text=Username')).toBeVisible()

    // Fill registration form — target inputs by placeholder to avoid brittle nth() indexing
    // Use a unique username that fits the 10-character limit (prefix + last 8 digits of timestamp)
    const username = `pw${Date.now().toString().slice(-8)}`
    await page.fill('input[placeholder="iskostudent"]', username)
    await page.fill('input[placeholder="your.name@cvsu.edu.ph"]', TEST_EMAIL)
    await page.fill('input[placeholder="Create a strong password"]', 'Aa123456')
    await page.fill('input[placeholder="Confirm your password"]', 'Aa123456')

    // Submit registration (click the form's submit button)
    await page.locator('form').getByRole('button', { name: 'Register' }).click()

    // The app may reject the registration if the email already exists — accept either outcome.
    let exists = false
    try {
      await page.waitForSelector('text=An account with this email already exists. Please sign in or reset your password.', { timeout: 3000 })
      exists = true
    } catch (e) {
      // not found within timeout — continue to check for Verify UI
    }

    if (exists) {
      await expect(page.locator('text=An account with this email already exists. Please sign in or reset your password.')).toBeVisible()
      return
    }

    // Otherwise the Verify heading should appear and show the email (allow extra time for backend OTP)
    await expect(page.getByRole('heading', { name: 'Verify Your Email' }).first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator(`text=Code sent to: ${TEST_EMAIL}`)).toBeVisible({ timeout: 20000 })

    // Click Resend if available; otherwise the cooldown should already be visible
    const resendBtn = page.getByRole('dialog').locator('button:has-text("Resend")').first()
    await expect(resendBtn).toBeVisible()
    if (await resendBtn.isEnabled()) {
      await resendBtn.click()
      // After clicking, the button should be disabled and show a cooldown
      await expect(resendBtn).toBeDisabled()
    } else {
      // If the button is initially disabled, ensure it's disabled (cooldown in effect)
      await expect(resendBtn).toBeDisabled()
    }

    // Enter a wrong (8-digit) code and attempt verify; expect an inline error
    const invalid = '00000000'
    for (let i = 0; i < invalid.length; i++) {
      await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(invalid[i])
    }
    await page.locator('button:has-text("Verify")').click()

    // Expect an inline error alert to be visible (message content may vary)
    await expect(page.locator('div[role="alert"]')).toBeVisible()

    // NOTE: DEV OTP helpers were removed; this test only verifies the presence of the Verify dialog and the resend UX.
    // Full end-to-end verification (consuming a real Supabase OTP) should be covered in integration tests that can access the email/Supabase logs.
  })
})
