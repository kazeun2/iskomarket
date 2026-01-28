Messaging migrations added (2026-01-15)

Files:
- `migrations/20260115-create-messaging-tables.sql` — creates `conversations`, `conversation_participants`, `messages` tables, indexes, triggers and RLS policies.
- `migrations/20260115-add-user-profile-fields.sql` — adds `display_name`, `avatar_url`, `student_status`, and `username` to `user_profile` if missing.

How to apply locally:
1. If you use Supabase CLI or `psql`, run the SQL files against your local or remote database.
   - supabase sql < migrations/20260115-create-messaging-tables.sql
   - supabase sql < migrations/20260115-add-user-profile-fields.sql

2. In the Supabase dashboard, also verify that Realtime is enabled for the `messages` table (Dashboard → Realtime → Postgres Changes).

3. After applying migrations, you can run the dev helper to create deterministic test users:
   - npm run dev:server

Notes:
- The migrations enable RLS and create conservative policies so only participants may read or insert messages.
- If your project uses different column names, the `messageService` includes fallbacks (message_text, content, body) but it's ideal to keep the canonical `message` column present.
