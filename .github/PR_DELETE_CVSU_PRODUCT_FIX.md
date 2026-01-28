PR: Fix CvSU product delete flow

Summary:
- Ensure deleting a CvSU-market row (cvsu_market_products) does not abort when product cleanup fails.
- Fix `admin_delete_cvsu_product` function (ambiguity and record type issues) so it can be safely invoked by clients.
- Add a tolerant trigger `cvsu_market_sync_product()` that swallows product-delete failures so DELETEs on cvsu rows don't fail.
- Add an automated SQL test `migrations/tests/20260101-test-delete-cvsu-product.sql` that asserts the admin RPC and delete fallback don't raise and that the final state is consistent.
- Add a small client-side improvement: after successfully deleting a cvsu row, attempt a product-level soft-delete and show a warning toast if that fails.

Files changed / added (brief):
- migrations/20251228-fix-cvsu-trigger-tolerate-product-delete.sql  (wrap delete_product_fallback in EXCEPTION block)
- migrations/20251229-fix-admin-delete-cvsu-product-ambiguity.sql (initial attempt, later refined)
- migrations/20251230-fix-admin-delete-keep-p_id.sql (keeps p_id param and qualifies table alias)
- migrations/20251231-fix-admin-delete-record-type.sql (uses %ROWTYPE and explicit RETURN QUERY)
- migrations/tests/20260101-test-delete-cvsu-product.sql (automated test you can run in SQL editor)
- src/components/CvSUMarket.tsx (client: attempt product-level delete after cvsu deletion, warn on failure)

Testing instructions:
1) Run the tolerant trigger and admin RPC migration scripts (apply in order if necessary).
2) Run `migrations/tests/20260101-test-delete-cvsu-product.sql` in Supabase SQL editor as a superuser.
   - Expectation: "TEST PASSED" notice and no exceptions.
3) In the app, delete a CvSU product as an admin and confirm the card does not reappear after page reload.

Notes:
- The test uses temporary UUIDs and cleans up after itself; run manually in SQL editor.
- If your environment restricts admin RPCs for non-superusers, run the test as a database owner or via a trusted session.

Recommend reviewers: @backend-maintainer, @frontend-maintainer

