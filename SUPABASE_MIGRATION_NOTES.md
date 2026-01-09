Migration notes: sender_id/receiver_id vs buyer_id/seller_id

- If your database schema or generated types use `sender_id`/`receiver_id` but some migrations and RLS policies still reference `buyer_id`/`seller_id`, run the migration `migrations/20260109-add-meetup-columns-to-transactions.sql` as admin.
- After applying the migration, **restart the Supabase API** (Project → Settings → API → Restart) to refresh PostgREST's schema cache so relationship aliases are recognized.
- Re-generate TypeScript types locally to reflect the updated schema:

  supabase gen types typescript --schema public > src/lib/database.types.ts

- Verify by running the `scripts/test_transactions_insert.js` helper and by loading the app locally; inspect logs for RLS or schema cache errors.

If you'd like, I can prepare a PR with these migration updates and the tests; tell me when to proceed with remaining replacements across the repo.