-- supabase_admin_seed.sql
--
-- Usage:
-- 1) Create the corresponding Auth users first (recommended) using the Supabase Admin API or the Dashboard.
--    Example (replace <SUPABASE_URL> and <SERVICE_ROLE_KEY>):
--
-- curl -X POST '<SUPABASE_URL>/auth/v1/admin/users' \
--   -H 'Content-Type: application/json' \
--   -H "apikey: <SERVICE_ROLE_KEY>" \
--   -d '{
--     "email": "mariakazandra.bendo@cvsu.edu.ph",
--     "password": "ChangeMe123!",
--     "email_confirm": true
--   }'
--
-- The response includes the created user's `id` (UUID). Use that id in the INSERTs below.
--
-- 2) Insert rows into your project's `public.users` table. Replace the UUIDs with the ones from step (1).
--
BEGIN;

-- Example admin user (replace id with the real auth user id)
-- Note: this project uses `full_name` and `created_at` in the canonical schema.
-- If your Supabase project has an auth trigger that references `date_registered`,
-- add that column first (see below) or change the trigger to use `created_at`.
INSERT INTO public.users (id, email, username, is_admin)
VALUES
  ('8611970e-2492-47ae-92a3-14dc8a5cdfbc', 'mariakazandra.bendo@cvsu.edu.ph', 'mariakazandra.bendo', TRUE)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  is_admin = EXCLUDED.is_admin; 

-- Example accounts for demo (replace ids if creating real auth users)
INSERT INTO public.users (id, email, username, is_admin)
VALUES
  ('0768df90-2f14-4d49-83be-5eafe6381f1b', 'example@cvsu.edu.ph', 'example', FALSE),
  ('d0ca5c98-5ed8-4001-9ff9-3976a24c5182', 'example.admin@cvsu.edu.ph', 'example.admin', TRUE)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  is_admin = EXCLUDED.is_admin;

COMMIT;

-- Helpful fix SQL (run in Supabase SQL editor as an admin if your auth triggers expect `date_registered`):
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- - For bulk creation, you can script the admin user creation via the Admin API and then apply these SQL inserts programmatically.
