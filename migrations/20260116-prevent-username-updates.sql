-- Prevent username updates by regular users
-- This migration adds a trigger that prevents changing the `username` column
-- on `public.users` unless the request is made by a privileged/system role
-- (e.g., service_role or admin). This enforces username immutability server-side.

BEGIN;

-- Create or replace a trigger function that blocks username changes
CREATE OR REPLACE FUNCTION public.prevent_username_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.username IS DISTINCT FROM OLD.username THEN
      -- Allow only requests that include a privileged role in the JWT claims
      -- (service_role or admin). When running in contexts without JWT claims,
      -- such as manual DB updates, the current_setting('request.jwt.claims', true)
      -- call returns NULL and the check below will block the change.
      IF current_setting('request.jwt.claims', true) IS NULL
         OR (current_setting('request.jwt.claims', true) !~ '"role":"service_role"'
             AND current_setting('request.jwt.claims', true) !~ '"role":"admin"'
             AND current_setting('request.jwt.claims', true) !~ '"role":"supabase_admin"') THEN
        RAISE EXCEPTION 'Username is immutable and cannot be changed.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to users table (ensure idempotency)
DROP TRIGGER IF EXISTS prevent_username_change_trigger ON public.users;
CREATE TRIGGER prevent_username_change_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_username_change();

COMMIT;
