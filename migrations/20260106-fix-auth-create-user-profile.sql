-- OWNER-ONLY: Replace the auth user -> profile trigger safely
-- Run as the auth schema owner (supabase_auth_admin) or a PostgreSQL superuser.
-- DO NOT run this as the project owner in Supabase Cloud (it will fail with "must be owner of table users").

/*
DO $$
BEGIN
  -- Replace or create a safe SECURITY DEFINER function that reads NEW as jsonb so it tolerates missing columns
  CREATE OR REPLACE FUNCTION public.isk_create_user_profile() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER AS $func$
  DECLARE
    _new jsonb := to_jsonb(NEW);
    _username text;
    _program text;
    _college text;
  BEGIN
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

  -- Make sure the trigger exists and points to the safe function. If you previously dropped it, this recreates it.
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

--
-- Diagnostic queries (run as a DB admin) to find any functions that reference `user_metadata`
--
-- 1) List triggers on auth.users and the function they call:
-- SELECT c.relname AS table, t.tgname AS trigger_name, pg_get_triggerdef(t.oid) AS trigger_def,
--        p.proname AS function_name, n.nspname AS function_schema
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- LEFT JOIN pg_proc p ON t.tgfoid = p.oid
-- LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE c.relname = 'users' AND c.relnamespace = 'auth'::regnamespace;
--
-- 2) Find functions whose definitions contain the literal `user_metadata` (works more reliably than ILIKE in some environments):
-- SELECT n.nspname AS schema, p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE position('user_metadata' in pg_get_functiondef(p.oid)) > 0;
--
-- If the diagnostic queries find any functions referencing `user_metadata`, inspect and replace them with a safe variant (use to_jsonb(NEW) or safe json extraction).
-- If you don't have auth schema owner access you can either ask an owner to run this file, or apply the application-level workaround described in the repo README (upsert a profile from your backend after verifyOtp).
