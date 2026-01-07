-- Backfill missing `users` profile rows for auth users who have products
-- Run this as an admin (service role) in Supabase SQL editor.

DO $$
DECLARE
  has_user_metadata boolean;
BEGIN
  -- Detect if auth.users.user_metadata exists in this project.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'user_metadata'
  ) INTO has_user_metadata;

  IF has_user_metadata THEN
    -- Use username from user_metadata when available.
    INSERT INTO public.users (id, email, username, is_active, date_registered)
    SELECT
      p.seller_id AS id,
      au.email AS email,
      COALESCE((au.user_metadata ->> 'username')::text, au.email::text, p.seller_id::text) AS username,
      true AS is_active,
      NOW() AS date_registered
    FROM (
      SELECT DISTINCT seller_id FROM public.products WHERE seller_id IS NOT NULL
    ) p
    LEFT JOIN public.users u ON u.id = p.seller_id
    LEFT JOIN auth.users au ON au.id = p.seller_id
    WHERE u.id IS NULL
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Fall back to using the auth users email or the seller_id string as username.
    INSERT INTO public.users (id, email, username, is_active, date_registered)
    SELECT
      p.seller_id AS id,
      au.email AS email,
      COALESCE(au.email::text, p.seller_id::text) AS username,
      true AS is_active,
      NOW() AS date_registered
    FROM (
      SELECT DISTINCT seller_id FROM public.products WHERE seller_id IS NOT NULL
    ) p
    LEFT JOIN public.users u ON u.id = p.seller_id
    LEFT JOIN auth.users au ON au.id = p.seller_id
    WHERE u.id IS NULL
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Backfill of missing user profiles complete. Check public.users for new rows.';
END$$;
