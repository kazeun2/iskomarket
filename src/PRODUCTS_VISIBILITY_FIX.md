# Products visibility: root cause and fixes

Summary:
- Symptom: Products appear immediately after posting but may disappear after logout/login or may not be visible to other users.

Root causes discovered:
1. Some user accounts had missing `users` profile rows (profile creation can be blocked by RLS during registration) which meant `getCurrentUser()` returned `null` and the app treated the session as if no profile existed; as a result "My Products" UI (which depended on `currentUser`) did not fetch the user's products.
2. The `active_products_view` and some UI flows expect a valid `users` row for the product seller (checks like `u.is_active = true`), so products belonging to profiles that are missing or flagged inactive/suspended would not appear in views that use that view.

What I changed:
- `src/components/UserDashboard.tsx`:
  - Added a `useEffect` to load the user's products from the DB (`getUserProducts(currentUser.id)`) when `currentUser` changes.
  - Added a realtime subscription to product inserts/updates/deletes and reconciles local "My Products" list when changes involve the current user.
  - Added a loading state and explicit UI feedback while fetching "My Products".

- `src/lib/auth.ts`:
  - Updated `getCurrentUser()` to return a *minimal fallback profile* when a `users` row is missing (e.g., because profile creation was blocked by RLS). This prevents the app from losing context about the authenticated user and allows "My Products" and other per-user features to work even when the profile row is absent. A server-side upsert of the profile is still recommended.

Why this fixes the problem:
- Returning a minimal profile ensures that `currentUser` is populated after sign-in, so components that rely on `currentUser.id` (e.g., `getUserProducts`) can fetch and display the user's listings.
- Realtime subscription in `UserDashboard` ensures the user's list stays in sync on inserts/updates/deletes, removing reliance on optimistic UI updates alone.

Operational steps & checks:
1. If you see a product that should be visible but isn't, run `node scripts/check_products_flags.js` to ensure the product flags are correct.
2. If a user's products are missing from the UI, verify that the `users` table has a profile row for that auth user. If missing, upsert a basic profile as admin:
   ```sql
   INSERT INTO users (id, email, username, is_active)
   VALUES ('<user-id>', '<email>', '<username>', true)
   ON CONFLICT DO NOTHING;
   ```
3. Verify `migrations/20251216-fix-products-rls.sql` has been applied to ensure SELECT/INSERT policies for `products` are correct.

If the issue persists after these changes, run the `scripts/e2e_products_visibility.js` script to reproduce the flow and gather logs.
Suggested migration: backfill missing profiles for sellers

If you find auth users that do not have `users` profile rows (this will cause product visibility and view filters to exclude products in some views), run the migration:

```
-- Run migrations/20251217-backfill-missing-user-profiles.sql in Supabase SQL editor as an admin
```

This will insert minimal profile rows for any `seller_id` referenced in `products` that lacks a profile.---
If you'd like, I can also:
- Add a small server-side migration that backfills missing `users` profiles for auth users who have products, or
- Add a health-check script that lists auth users without profiles so you can upsert them in bulk.
