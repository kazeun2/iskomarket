Supabase RLS & Realtime Guide

This project expects the following Supabase configuration for products and messages to work correctly:

1) Row Level Security (RLS) policies (examples)

-- Allow authenticated users to insert products they own
CREATE POLICY "Users can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Allow everyone to SELECT visible products
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (is_available = true AND is_deleted = false);

-- Allow users in a conversation to INSERT messages
CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id

⚠️ Note: If you recently migrated column names (buyer_id/seller_id → sender_id/receiver_id), run the `migrations/20260109-add-meetup-columns-to-transactions.sql` migration and then restart the Supabase API (Project → Settings → API → Restart) so PostgREST refreshes its schema cache. After restarting, re-generate types locally with:

```bash
supabase gen types typescript --schema public > src/lib/database.types.ts
```
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

Note: A full schema with policies is included in `src/ISKOMARKET_SUPABASE_SCHEMA.sql`.

2) Enable realtime for `products` and `messages` tables

In the Supabase Dashboard > Database > Replication / Realtime, ensure the `products` and `messages` tables are enabled for realtime (postgres_changes) so clients can subscribe to INSERT/UPDATE/DELETE events.

3) Troubleshooting

- If `insert()` returns an error with RLS, check that the client session is authenticated and that `seller_id` equals the authenticated `auth.uid()`.
- Messages must be linked to a `conversation_id` (referencing `conversations.id`) for RLS policies to permit inserts; when sending messages the client should either provide a `conversation_id` or the server should `getOrCreateConversation(product_id, sender, receiver)` before inserting.
- The canonical message column in the DB is `message_text`; if your DB has legacy `content` or `message` columns, run the provided migration `migrations/20251216-fix-messages-schema.sql` to add/backfill `message_text` and link orphaned messages.
- If you see UI-only optimistic items (they appear locally but not in Supabase), it's because the client added them before the server insert completed; the UI now waits for the insert result and will rollback on error.

4) Applying changes

Run SQL in the Supabase SQL editor or via psql using the `ISKOMARKET_SUPABASE_SCHEMA.sql` in this repo.

If you need help applying policies or verifying realtime, I can provide the exact SQL commands to run or check your Supabase dashboard for missing permissions.
