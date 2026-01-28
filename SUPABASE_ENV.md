**Where to put Supabase keys**

- Create a file at the project root named `.env` (or `.env.local` for local-only values).
- Add your Supabase project details using Vite environment variable names (the `VITE_` prefix is required):

  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key

- Example: use the provided `.env.example` as a starting point.

Notes:
- Keep your anon key private in development. For server-side operations that require the `service_role` key use a secure server.
- To create admin or example accounts in your database, you can:
  - Create the corresponding Auth users first using the Supabase Dashboard or the Admin API (requires `service_role` key), then run the SQL in `src/supabase_admin_seed.sql` to insert matching profile rows.
- If you see "Database error saving new user" during sign-up, your Supabase project's auth trigger likely expects a `date_registered` column. Add it via the Supabase SQL editor (admin) with:

  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW();

A migration file has also been added to this repo at `migrations/20260106-add-date-registered.sql` — you can copy/paste it into the Supabase SQL editor or run it with psql to apply and backfill existing rows.

- Restart the dev server after updating `.env` so Vite picks up the new variables.
