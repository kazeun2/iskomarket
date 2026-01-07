-- OWNER-ONLY: This migration contains DO blocks that require the auth schema owner (supabase_auth_admin) or superuser to execute.
-- DO NOT run this file in Supabase Cloud as the project owner; attempting to ALTER/CREATE triggers on auth.users will fail with "must be owner of table users".
-- If you are on self-hosted Postgres and have a superuser/owner role, you may run the blocks below after reviewing them.
-- Recommended workflow for Supabase Cloud (no owner access):
-- 1) Remove/disable any custom triggers on public.users (you can run ALTER TABLE public.users DISABLE TRIGGER <name>).
-- 2) Keep profile creation in the application (client-side upsert after verifyOtp) and avoid creating triggers on auth.users.
-- 2026-01-06: create a SECURITY DEFINER function + trigger to safely create public.users profiles
-- This protects sign-up from failing due to RLS or missing defaults. Run as an admin in Supabase SQL editor.

/* OWNER-ONLY BLOCK: Create a SECURITY DEFINER function that inserts a profile row if none exists.
   This block must be run as the auth schema owner (supabase_auth_admin) or a PostgreSQL superuser.
   DO NOT run this in Supabase Cloud as the project owner; it will fail with "must be owner of table users".

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'isk_create_user_profile') THEN
    CREATE OR REPLACE FUNCTION public.isk_create_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER AS $func$
    DECLARE
      _new jsonb := to_jsonb(NEW);
      _username text;
      _program text;
      _college text;
    BEGIN
      -- Use to_jsonb(NEW) so this function works even when auth.users has no user_metadata column.
      -- to_jsonb(NEW)->'user_metadata' will be NULL when the column is absent, avoiding "record \"new\" has no field \"user_metadata\"" errors.
      _username := COALESCE(_new->'user_metadata'->> 'username', split_part(NEW.email, '@', 1));
      _program := COALESCE(_new->'user_metadata'->> 'program', '');
      _college := COALESCE(_new->'user_metadata'->> 'college', '');

      INSERT INTO public.users (id, email, username, program, college, date_registered, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        _username,
        _program,
        _college,
        NOW(), NOW(), NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $func$;
  END IF;
END$$;
*/

/* OWNER-ONLY BLOCK: Create trigger on auth.users to call the above function after insert.
   This requires the auth schema owner (supabase_auth_admin) and cannot be run by the project owner in Supabase Cloud.
   If you are on self-hosted Postgres with owner access, you may uncomment and run this block.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trg_auth_create_user_profile' AND c.relname = 'users' AND c.relnamespace = 'auth'::regnamespace
  ) THEN
    CREATE TRIGGER trg_auth_create_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.isk_create_user_profile();
  END IF;
END$$;
*/

-- Notes:
-- - Run this in Supabase SQL Editor as an admin (service_role) to ensure the function runs with elevated privileges.
-- - This function will be a safe fallback: it only inserts minimal columns and uses ON CONFLICT DO NOTHING to avoid collisions.
-- - If you already have a custom auth trigger, review for duplication before applying.
