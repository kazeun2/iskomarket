import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('shows simple error message on wrong password', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Sign In')
    await page.fill('input[type="email"]', 'hazel.perez@cvsu.edu.ph')
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('text=Sign In to IskoMarket')

    await expect(page.locator('text=Invalid email or password. Please try again.')).toBeVisible({ timeout: 5000 })
  })
})