Development helper: disable email confirmation

This project includes an optional local dev helper that lets you create confirmed Supabase users during development without configuring SMTP or email verification.

1) Add to your `.env.local` (DO NOT commit the service role key):

```
VITE_DEV_SKIP_EMAIL_CONFIRMATION=true
# Optional: expose the service role key to the dev client to enable automatic email confirmation in development
# WARNING: This is INSECURE and should only be used locally for testing.
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2) Start the helper server in a separate terminal:

```bash
npm run dev:server
```

Note: When running the frontend using Vite (local dev), the app prefers the local dev helper endpoints under `/dev/*` to avoid hitting Next.js API routes that are not available during Vite dev. Ensure you run `npm run dev:server` so endpoints like `/dev/verify-reset-otp` are reachable; otherwise, enable stub mode (`VITE_TEST_RESET_STUB`, or set `window.__TEST_RESET_STUB__ = true` in the browser) for deterministic local testing.

3) Run the app (`npm run dev`). Registering a user will now use the helper server to create a confirmed user and sign them in immediately.
Note: The dev server also exposes additional helper endpoints useful for running Playwright/e2e tests locally:
- `POST /dev/insert-otp` — (DEPRECATED) previously inserted a test OTP into `otp_verifications`. The project now relies on Supabase Auth OTP flows; this endpoint is no longer required for verification.
- `GET /dev/latest-otp?email=...` — (DEPRECATED) previously returned the most recent OTP for an email for use in tests. Use integration tests that can access real emails or Supabase logs instead.

Use these endpoints only in development; they require your `SUPABASE_SERVICE_ROLE_KEY` to operate and must never be run against production.
Security: This helper uses your Supabase `service_role` key and should only be run in local development. Never expose or commit the service role key.


## E2E tests with a separate test DB (Realtime) 🔁

We provide dedicated e2e scripts that run against a **separate Supabase test project** and use real Realtime subscriptions. ALWAYS run these against a separate test DB (do not point them at production or your main dev project).

Create a `.env.test` file with the TEST_* variables and run the tests directly with Node.js:

```bash
# .env.test (example)
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=anon-public-key-for-test-project
TEST_SUPABASE_SERVICE_ROLE_KEY=service-role-key-for-test-project
```

Available scripts:

- `npm run test:e2e:realtime` — subscribes to `products` and `messages` and verifies realtime INSERT events (used by the reproducibility checks).
- `npm run test:e2e:admin-audit` — subscribes to `admin_audit_logs` (viewer/anon) and inserts an audit row via the service role key to verify realtime delivery and RLS/visibility.

Notes:
- The e2e scripts will fail fast if required `TEST_*` variables are missing.
- The service role key is required to insert admin-level rows during tests (bypasses RLS) — do NOT use the service role key in shared CI secrets unless you understand the implications; prefer a dedicated test project with isolated credentials.

---

## Troubleshooting: Product visibility & RLS issues 🔧
If a product appears in the database but is not visible to other users or disappears after logout/login, follow these steps to diagnose and fix the problem:

1. Apply the RLS migration (run `migrations/20251216-fix-products-rls.sql`) in the Supabase SQL editor to ensure correct SELECT/INSERT/UPDATE/DELETE policies.
2. Inspect product visibility flags using the `check:products-flags` script:
   - Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in your environment and run `npm run check:products-flags` to list rows with problematic flags (NULL/false/hidden/deleted).
3. Use the test script to reproduce behavior across auth sessions:
   - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `TEST_POSTER_EMAIL` / `TEST_POSTER_PASSWORD` and run `npm run test:products-visibility`.
4. If legacy rows have `is_available = NULL`, run `migrations/20251216-backfill-is_available.sql` (or run the UPDATE statement after review) to make them publicly queryable.


---

## Troubleshooting: Messages & RLS (conversation linking) 🔧
If message inserts are blocked by RLS or you observe messages with `conversation_id = NULL`, follow these steps:

1. Run the migration `migrations/20251216-fix-messages-schema.sql` to add/backfill `message_text` and auto-link orphaned messages to conversations.

   - Easiest: open the Supabase Dashboard → SQL editor, paste the file contents and run it as an admin.
   - If you have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment, you can try the helper script: `node scripts/run_migration.js migrations/20251216-fix-messages-schema.sql`.
   - If `admin.rpc('sql')` is not available in your project, run the SQL manually in the Supabase SQL editor as above.

2. After running the migration, re-run `npm run test:messages-flow` to verify messages are auto-linked and no admin fallback is required.

If you want, I can also run the migration for you if you provide the necessary admin credentials or enable `admin.rpc('sql')` in the project.

