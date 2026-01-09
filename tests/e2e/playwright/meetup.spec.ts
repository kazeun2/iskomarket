import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001'
const PASSWORD = process.env.TEST_REGISTER_PASSWORD || 'Aa123456'
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL

test.describe('Meet-up scheduling (e2e)', () => {
  test('buyer can propose a meet-up date and both users see the conversation card', async ({ page, request }) => {
    const devServer = process.env.DEV_SERVER_URL || 'http://localhost:9999'
    // Create seller (deterministic non-CVSU test email)
    const sellerEmail = process.env.TEST_SELLER_EMAIL || 'test+seller@example.com'
    const sellerUser = `seller${Date.now().toString().slice(-6)}`

    // Try to create via dev-server (preferred, deterministic)
    let sellerCreated = false
    try {
      const resp = await request.post(`${devServer}/dev/create-user`, { data: { email: sellerEmail, password: PASSWORD, username: sellerUser } }).catch(() => null)
      if (resp && resp.ok()) sellerCreated = true
    } catch (e) {
      // ignore and fall back to UI register
    }

    await page.goto(`${baseURL}/auth`)

    if (!sellerCreated) {
      await page.getByRole('button', { name: 'Register' }).first().click()
      await page.fill('input[placeholder="iskostudent"]', sellerUser)
      await page.fill('input[placeholder="your.name@cvsu.edu.ph"]', sellerEmail)
      await page.fill('input[placeholder="Create a strong password"]', PASSWORD)
      await page.fill('input[placeholder="Confirm your password"]', PASSWORD)
      // Enable runtime verify stub
      await page.evaluate(() => {
        ;(window as any).__TEST_VERIFY_OTP_STUB__ = true
        ;(window as any).__TEST_VERIFY_OTP_VALID__ = '12345678'
      })
      await page.locator('form').getByRole('button', { name: 'Register' }).click()

      // Wait for either Verify dialog or an "account exists" error to appear
      const existsText = page.locator('text=An account with this email already exists. Please sign in or reset your password.')
      const verifyHeading = page.getByRole('heading', { name: 'Verify Your Email' }).first()

      let winner: 'verify' | 'exists' | 'none' = 'none'
      try {
        winner = await Promise.race([
          verifyHeading.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'verify' as const),
          existsText.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'exists' as const),
        ])
      } catch (err) {
        // Neither the verify dialog nor exists text showed within timeout; assume flow advanced (maybe auto-signed-in or immediate sign-in required)
        winner = 'none'
      }

      if (winner === 'exists') {
        await expect(existsText).toBeVisible()
      } else if (winner === 'verify') {
        const valid = '12345678'
        for (let i = 0; i < valid.length; i++) {
          await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(valid[i])
        }
        await page.locator('button:has-text("Verify")').click()

        // Expect the Verify dialog to close and a success state (toast optional)
        await expect(page.getByRole('heading', { name: 'Verify Your Email' }).first()).toBeHidden({ timeout: 5000 })
        await expect(page.locator('text=Sign In').first()).toBeVisible({ timeout: 5000 })
        await page.fill('input[type="email"]', sellerEmail)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('text=Sign In to IskoMarket')
      }
    } else {
      // Seller was created by dev-server; go to sign-in and sign in
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', sellerEmail)
      await page.fill('input[type="password"]', PASSWORD)
      await page.click('text=Sign In to IskoMarket')
    }

    // Ensure we're signed in; try dev-server creation first for determinism, else fall back to UI sign-in/register
    try {
      const resp = await request.post(`${devServer}/dev/create-user`, { data: { email: sellerEmail, password: PASSWORD, username: sellerUser } }).catch(() => null)
      if (resp && resp.ok()) {
        // Try to ensure email is verified via dev-server OTP helpers (some Supabase setups require verification even for admin-created users)
        try {
          await request.post(`${devServer}/dev/insert-otp`, { data: { email: sellerEmail, otp: '123456', purpose: 'registration' } }).catch(() => null)
          const verifyResp = await request.post(`${devServer}/dev/verify-reset-otp`, { data: { email: sellerEmail, code: '123456' } }).catch(() => null)
          console.log('Dev verify response for seller:', verifyResp && verifyResp.status)
        } catch (e) {
          console.warn('Dev OTP verify attempt failed (non-fatal):', e?.message || e)
        }

        // Sign in directly
        await page.goto(`${baseURL}/auth`)
        await page.click('text=Sign In')
        await page.fill('input[type="email"]', sellerEmail)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('text=Sign In to IskoMarket')
        try {
          await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
        } catch (err) {
          console.error('Sign-in did not reach signed-in state. Saving debug artifacts...')
          await page.screenshot({ path: `test-results/debug-signin-${Date.now()}.png`, fullPage: true })
          console.error('Page HTML snapshot:\n', await page.content())
          throw err
        }
      } else {
        if (!(await page.locator('text=Sign Out').isVisible().catch(() => false))) {
          await page.click('text=Sign In')
          await page.fill('input[type="email"]', sellerEmail)
          await page.fill('input[type="password"]', PASSWORD)
          await page.click('text=Sign In to IskoMarket')
          try {
            await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
          } catch (err) {
            console.error('Sign-in did not reach signed-in state. Saving debug artifacts...')
            await page.screenshot({ path: `test-results/debug-signin-${Date.now()}.png`, fullPage: true })
            console.error('Page HTML snapshot:\n', await page.content())
            throw err
          }
        }
      }
    } catch (e) {
      // Fallback if dev server unavailable
      if (!(await page.locator('text=Sign Out').isVisible().catch(() => false))) {
        await page.click('text=Sign In')
        await page.fill('input[type="email"]', sellerEmail)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('text=Sign In to IskoMarket')
        await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
      }
    }

    // If we have service role credentials, create seller+product deterministically via admin API to avoid flaky UI posting
    let productTitle = `E2E TEST PRODUCT ${Date.now()}`
    if (SERVICE_ROLE && SUPABASE_URL) {
      const admin = createClient(SUPABASE_URL as string, SERVICE_ROLE as string, { auth: { persistSession: false } });

      // Ensure seller exists (create if missing)
      let sellerId: string | null = null
      try {
        const { data: existing } = await admin.from('users').select('id').eq('email', sellerEmail).limit(1).maybeSingle()
        if (existing && (existing as any).id) sellerId = (existing as any).id
      } catch (e) {}

      if (!sellerId) {
        try {
          const { data: created } = await admin.auth.admin.createUser({ email: sellerEmail, password: PASSWORD, user_metadata: { username: sellerUser }, email_confirm: true }) as any
          sellerId = (created as any)?.user?.id || (created as any)?.id || null
        } catch (e) {
          console.warn('Admin createUser for seller failed (non-fatal):', e?.message || e)
        }
      }

      if (sellerId) {
        try {
          await admin.from('user_profile').upsert([{ user_id: sellerId, username: sellerUser }])
        } catch (e) { /* ignore */ }

        const { data: prod } = await admin.from('products').insert([{ title: productTitle, description: 'E2E test product', price: 100, seller_id: sellerId, condition: 'Good', category: 'Test', location: 'Test' }]).select('id').single()
        if (prod && prod.id) {
          productTitle = `E2E TEST PRODUCT ${Date.now()}-${prod.id?.slice(0,6)}`
        }
      }

      // Sign out any UI session (cleanup) to prepare for buyer sign-in
      if ((await page.locator('text=Sign Out').isVisible().catch(() => false))) {
        await page.click('text=Sign Out')
      }
    } else {
      // No admin creds - keep UI posting path (best-effort)
      await page.click('button[aria-label="Post Product"]')
      productTitle = `E2E TEST PRODUCT ${Date.now()}`
      await page.fill('input[placeholder="e.g., Advanced Calculus Textbook - 3rd Edition"]', productTitle)
      await page.fill('input[placeholder="1000"]', '100')
      await page.click('text=Select category')
      const optTextbooks = page.locator('text=Textbooks')
      if (await optTextbooks.isVisible().catch(() => false)) {
        await optTextbooks.click()
      } else {
        await page.locator('[role="option"]').first().click()
      }
      await page.click('text=Select condition')
      await page.locator('text=Good').click()
      await page.click('text=Select location')
      await page.locator('[role="option"]').nth(0).click()
      await page.setInputFiles('input#image-upload', 'tests/e2e/playwright/fixtures/dummy.png')
      await page.click('button:has-text("Preview Listing")')
      await expect(page.getByText('Preview Your Product')).toBeVisible({ timeout: 5000 })
      await page.locator('text=Preview Your Product').locator('..').locator('button').last().click()
      await expect(page.locator('text=Product posted successfully!')).toBeVisible({ timeout: 10000 })
      await page.click('text=Sign Out')
    }

    // Create buyer account and sign in
    await page.goto(`${baseURL}/auth`)
    await page.getByRole('button', { name: 'Register' }).first().click()
    // Use the provided deterministic test email (non-CVSU)
    const buyerEmail = process.env.TEST_BUYER_EMAIL || 'test+buyer@example.com'
    const buyerUser = `buyer${Date.now().toString().slice(-6)}`
    await page.fill('input[placeholder="iskostudent"]', buyerUser)
    await page.fill('input[placeholder="your.name@cvsu.edu.ph"]', buyerEmail)
    await page.fill('input[placeholder="Create a strong password"]', PASSWORD)
    await page.fill('input[placeholder="Confirm your password"]', PASSWORD)

    // Prefer deterministic admin creation for buyer when service-role available
    let buyerCreated = false

    if (SERVICE_ROLE && SUPABASE_URL) {
      try {
        const admin = createClient(SUPABASE_URL as string, SERVICE_ROLE as string, { auth: { persistSession: false } });
        let buyerId: string | null = null
        try {
          const { data: existing } = await admin.from('users').select('id').eq('email', buyerEmail).limit(1).maybeSingle()
          if (existing && (existing as any).id) buyerId = (existing as any).id
        } catch (e) {}

        if (!buyerId) {
          try {
            const { data: created } = await admin.auth.admin.createUser({ email: buyerEmail, password: PASSWORD, user_metadata: { username: buyerUser }, email_confirm: true }) as any
            buyerId = (created as any)?.user?.id || (created as any)?.id || null
          } catch (e) {
            console.warn('Admin createUser for buyer failed (non-fatal):', e?.message || e)
          }
        }

        if (buyerId) {
          try { await admin.from('user_profile').upsert([{ user_id: buyerId, username: buyerUser }]) } catch (e) {}
          buyerCreated = true
        }
      } catch (e) {
        // ignore and fall back
      }
    }

    // Fallback to dev-server helper if admin not available
    if (!buyerCreated) {
      try {
        const resp = await request.post(`${devServer}/dev/create-user`, { data: { email: buyerEmail, password: PASSWORD, username: buyerUser } }).catch(() => null)
        if (resp && resp.ok()) buyerCreated = true
      } catch (e) { /* ignore */ }
    }

    if (!buyerCreated) {
      // UI register fallback
      await page.evaluate(() => {
        ;(window as any).__TEST_VERIFY_OTP_STUB__ = true
        ;(window as any).__TEST_VERIFY_OTP_VALID__ = '12345678'
      })
      await page.locator('form').getByRole('button', { name: 'Register' }).click()
    } else {
      // Sign in the buyer (created by admin or dev-server)
      try {
        await page.click('text=Sign In')
        await page.fill('input[type="email"]', buyerEmail)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('text=Sign In to IskoMarket')
        await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
      } catch (err) {
        console.error('Sign-in did not reach signed-in state. Saving debug artifacts...')
        await page.screenshot({ path: `test-results/debug-signin-${Date.now()}.png`, fullPage: true })
        console.error('Page HTML snapshot:\n', await page.content())
        throw err
      }
    }
    const existsAfter = page.locator('text=An account with this email already exists. Please sign in or reset your password.')
    const verifyHeading2 = page.getByRole('heading', { name: 'Verify Your Email' }).first()

    let winner2: 'verify' | 'exists' | 'none' = 'none'
    try {
      winner2 = await Promise.race([
        verifyHeading2.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'verify' as const),
        existsAfter.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'exists' as const),
      ])
    } catch (err) {
      // No verify or exists message - maybe buyer was pre-created; continue
      winner2 = 'none'
    }

    if (winner2 === 'exists') {
      await expect(existsAfter).toBeVisible()
    } else if (winner2 === 'verify') {
      const valid2 = '12345678'
      for (let i = 0; i < valid2.length; i++) {
        await page.locator(`[data-testid="otp-digit-${i + 1}"]`).fill(valid2[i])
      }
      await page.locator('button:has-text("Verify")').click()

      await expect(page.getByRole('heading', { name: 'Verify Your Email' }).first()).toBeHidden({ timeout: 5000 })
      await expect(page.locator('text=Sign In').first()).toBeVisible({ timeout: 5000 })
      await page.fill('input[type="email"]', buyerEmail)
      await page.fill('input[type="password"]', PASSWORD)
      await page.click('text=Sign In to IskoMarket')
    }

    // Ensure buyer is signed in; first try dev-server sign-in if user exists, else fallback to UI sign-in
    if (!(await page.locator('text=Sign Out').isVisible().catch(() => false))) {
      try {
        // Attempt to ensure buyer exists and sign in via UI
        const resp = await request.post(`${devServer}/dev/create-user`, { data: { email: buyerEmail, password: PASSWORD, username: buyerUser } }).catch(() => null)
        if (resp && resp.ok()) {
          await page.click('text=Sign In')
          await page.fill('input[type="email"]', buyerEmail)
          await page.fill('input[type="password"]', PASSWORD)
          await page.click('text=Sign In to IskoMarket')
          try {
            await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
          } catch (err) {
            console.error('Sign-in did not reach signed-in state. Saving debug artifacts...')
            await page.screenshot({ path: `test-results/debug-signin-${Date.now()}.png`, fullPage: true })
            console.error('Page HTML snapshot:\n', await page.content())
            throw err
          }
        } else {
          await page.click('text=Sign In')
          await page.fill('input[type="email"]', buyerEmail)
          await page.fill('input[type="password"]', PASSWORD)
          await page.click('text=Sign In to IskoMarket')
          try {
            await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
          } catch (err) {
            console.error('Sign-in did not reach signed-in state. Saving debug artifacts...')
            await page.screenshot({ path: `test-results/debug-signin-${Date.now()}.png`, fullPage: true })
            console.error('Page HTML snapshot:\n', await page.content())
            throw err
          }
        }
      } catch (e) {        await page.click('text=Sign In')
        await page.fill('input[type="email"]', buyerEmail)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('text=Sign In to IskoMarket')
        await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })
      }
    }

    // Go to marketplace and open the product
    await page.goto(baseURL)
    await expect(page.locator(`text=${productTitle}`)).toBeVisible({ timeout: 10000 })
    await page.click(`text=${productTitle}`)

    // Click Message to contact seller
    await page.click('button:has-text("Message")')

    // In the meet-up reminder modal, click 'Agree & Continue'
    await expect(page.locator('text=Reminder: Meet-Up')).toBeVisible()
    await page.click('button:has-text("Agree & Continue")')

    // Wait for Chat modal to open (textarea visible)
    await expect(page.locator('textarea[placeholder="Type your message..."]')).toBeVisible({ timeout: 5000 })

    // Click the calendar icon button (preceding the textarea)
    await page.locator('//textarea[@placeholder="Type your message..."]/preceding::button[1]').click()

    // Wait for DatePicker modal
    await expect(page.getByRole('heading', { name: 'Choose Meet-Up Date' })).toBeVisible({ timeout: 5000 })

    // Pick a day (choose 15th) - click a day button inside the dialog
    await page.locator('//div[contains(@class,"modal-standard")]//button:has-text("15")').first().click().catch(async () => {
      // Fallback: click any day button that's enabled
      await page.locator('//div[contains(@class,"modal-standard")]//button[not(@disabled)]').nth(0).click()
    })

    // Confirm date
    await page.click('button:has-text("Confirm Date")')

    // Wait for success toast
    await expect(page.locator('text=Meet-up date proposed!')).toBeVisible({ timeout: 10000 })

    // Verify chat contains automated meetup message
    await expect(page.locator('text=Meet-up proposed')).toBeVisible({ timeout: 5000 })

    // Go to My Dashboard and verify conversation card appears for buyer
    await page.getByTitle('My Dashboard').click()
    await expect(page.locator(`text=About: ${productTitle}`)).toBeVisible({ timeout: 5000 })

    // Sign out buyer
    await page.click('text=Sign Out')

    // Sign in as seller and verify they also see the conversation card
    await page.goto(`${baseURL}/auth`)
    await page.click('text=Sign In')
    await page.fill('input[type="email"]', sellerEmail)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('text=Sign In to IskoMarket')
    await expect(page.locator('text=Sign Out').first()).toBeVisible({ timeout: 8000 })

    await page.getByTitle('My Dashboard').click()
    await expect(page.locator(`text=About: ${productTitle}`)).toBeVisible({ timeout: 5000 })
  })
})
