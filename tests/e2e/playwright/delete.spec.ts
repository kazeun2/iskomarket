import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const baseURL = process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const TEST_EMAIL = process.env.TEST_POSTER_EMAIL;
const TEST_PASSWORD = process.env.TEST_POSTER_PASSWORD;

// This test requires service role & test account env vars to run reliably in CI/local
test.describe('Product delete flow (owner)', () => {
  test('owner can delete their product and it is removed from UI and DB', async ({ page }) => {
    test.skip(!SERVICE_ROLE || !SUPABASE_URL || !TEST_EMAIL || !TEST_PASSWORD, 'Missing SUPABASE_SERVICE_ROLE_KEY/URL or TEST_POSTER_EMAIL/PASSWORD; skipping owner delete E2E test');

    // Create admin client to seed a product for the test user
    const admin = createClient(SUPABASE_URL as string, SERVICE_ROLE as string, { auth: { persistSession: false } });

    // Ensure test user exists (create if missing)
    let userId: string | null = null;
    try {
      const { data: users } = await admin.from('users').select('id').eq('email', TEST_EMAIL).limit(1).maybeSingle();
      if (users && users.id) userId = users.id;
    } catch (e) {
      // ignore
    }

    if (!userId) {
      // create user via admin API
      try {
        const { data: created } = await admin.auth.admin.createUser({ email: TEST_EMAIL as string, password: TEST_PASSWORD as string, email_confirm: true }) as any;
        userId = (created as any)?.user?.id || (created as any)?.id || null;
      } catch (e) {
        console.warn('Could not create test user via admin createUser, attempting lookup by email');
        const { data: lookup } = await admin.from('users').select('id').eq('email', TEST_EMAIL).limit(1).maybeSingle();
        userId = lookup?.id || null;
      }
    }

    test.skip(!userId, 'Could not determine test user id; skipping');

    const title = `e2e-delete-${Date.now()}`;

    // Insert a product owned by test user
    const { data: prod, error: prodErr } = await admin.from('products').insert([{ title, description: 'E2E delete test', price: 10, seller_id: userId, condition: 'Good', location: 'Test', images: [], is_available: true, is_deleted: false, is_hidden: false }]).select('*').single();
    test.skip(!!prodErr, 'Failed to insert product for test; skipping');
    const productId = prod.id;

    // Sign in via UI
    await page.goto(`${baseURL}/auth`);
    await page.fill('input[type="email"]', TEST_EMAIL as string);
    await page.fill('input[type="password"]', TEST_PASSWORD as string);
    await page.click('text=Sign In to IskoMarket');

    // Wait for navigation to authenticated area
    await page.waitForURL((url) => !url.pathname?.startsWith('/auth'), { timeout: 10000 });

    // Go to home and look for the product card by title
    await page.goto(baseURL);
    const card = page.locator(`text=${title}`).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Open product detail
    await card.click();

    // Click delete button (owner delete) - icon button with title "Delete Product"
    await page.locator('button[title="Delete Product"]').click();

    // Confirm dialog visible and click Delete
    const deleteButton = page.locator('button:has-text("Delete")').filter({ hasText: 'Delete' }).first();
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Expect either success toast or a friendly "already deleted" info (both are acceptable outcomes as long as DB ends up soft-deleted)
    await Promise.race([
      page.locator('text=Product deleted successfully!').waitFor({ timeout: 10000 }),
      page.locator('text=Product removed (was already deleted)').waitFor({ timeout: 10000 })
    ]);

    // Ensure the product card is no longer visible on the home page
    await page.goto(baseURL);
    await expect(page.locator(`text=${title}`)).toHaveCount(0, { timeout: 10000 });

    // Verify in DB that product is soft-deleted (is_deleted should be true)
    const { data: afterRow } = await admin.from('products').select('id,is_deleted').eq('id', productId).maybeSingle();
    expect(afterRow).not.toBeNull();
    if (!afterRow) throw new Error('Deleted product row not found for verification');
    expect((afterRow as any).is_deleted).toBe(true);

    // Cleanup: remove product row completely via admin to keep DB tidy
    try { await admin.from('products').delete().eq('id', productId); } catch (e) { /* ignore cleanup failures */ }
  });
});