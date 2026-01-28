-- supabase_users_insert_policy.sql
-- Create a safe RLS policy to allow users to insert their own profile rows
-- Run this in Supabase SQL editor (admin) or include in your deployment process

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated clients to insert a user row where the JWT subject equals the new row id
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: This policy allows the client (with a valid JWT for the user) to insert a row
-- where auth.uid() (the authenticated user's id) equals the inserted id. Supabase
-- auth sign-up process should be able to insert the profile when the auth context
-- provides the user's id.
--
-- IMPORTANT: The application no longer relies on a DB auth-trigger to auto-create
-- profile rows during sign-up. Instead, the client explicitly inserts/updates (upserts)
-- the `public.users` profile after successful OTP verification. Running an auth
-- trigger that also inserts profiles can lead to duplicate/competing behavior and
-- subtle race conditions. If you previously installed an auth trigger, consider
-- removing or disabling it and prefer using this policy + client-side upserts.
-- If your sign-up flow still fails due to RLS, consider running the auth create +
-- profile insert from a server with the service_role key, or adjust server-side policies appropriately.