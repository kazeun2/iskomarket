-- Make active_products_view tolerant of missing users rows and missing user flags
-- Run this as an admin in Supabase SQL editor.

-- Defensive migration: replace view only if safe; otherwise create an alternate safe view
DO $$
DECLARE
  v_reg regclass;
  dep_count int := 0;
BEGIN
  -- Try to resolve existing view; if it doesn't exist, set v_reg to NULL
  BEGIN
    v_reg := 'public.active_products_view'::regclass;
  EXCEPTION WHEN undefined_object THEN
    v_reg := NULL;
  END;

  IF v_reg IS NULL THEN
    -- view does not exist, create it directly
    EXECUTE $sql$
      CREATE VIEW public.active_products_view AS
      SELECT 
        p.*, 
        u.username as seller_username,
        u.username as seller_name,
        u.avatar_url as seller_avatar,
        u.credit_score as seller_credit_score,
        u.is_trusted_member as seller_is_trusted
      FROM public.products p
      LEFT JOIN public.users u ON p.seller_id = u.id
      WHERE (p.is_available IS NULL OR p.is_available = true)
        AND COALESCE(p.is_deleted, false) = false
        AND COALESCE(p.is_hidden, false) = false
        AND COALESCE(u.is_active, true) = true
        AND COALESCE(u.is_suspended, false) = false;
    $sql$;

    RAISE NOTICE 'active_products_view created.';
    RETURN;
  END IF;

  -- Count direct dependencies on the view
  SELECT COUNT(*) INTO dep_count
  FROM pg_depend d
  WHERE d.refobjid = v_reg;

  IF dep_count = 0 THEN
    -- Safe to replace in place
    EXECUTE $sql$
      CREATE OR REPLACE VIEW public.active_products_view AS
      SELECT 
        p.*, 
        u.username as seller_username,
        u.username as seller_name,
        u.avatar_url as seller_avatar,
        u.credit_score as seller_credit_score,
        u.is_trusted_member as seller_is_trusted
      FROM public.products p
      LEFT JOIN public.users u ON p.seller_id = u.id
      WHERE (p.is_available IS NULL OR p.is_available = true)
        AND COALESCE(p.is_deleted, false) = false
        AND COALESCE(p.is_hidden, false) = false
        AND COALESCE(u.is_active, true) = true
        AND COALESCE(u.is_suspended, false) = false;
    $sql$;

    RAISE NOTICE 'active_products_view replaced successfully.';
  ELSE
    -- Create a safe alternate view name to avoid breaking dependents
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c WHERE c.relname = 'active_products_view_safe' AND c.relkind = 'v'
    ) THEN
      EXECUTE $sql$
        CREATE VIEW public.active_products_view_safe AS
        SELECT 
          p.*, 
          u.username as seller_username,
          u.username as seller_name,
          u.avatar_url as seller_avatar,
          u.credit_score as seller_credit_score,
          u.is_trusted_member as seller_is_trusted
        FROM public.products p
        LEFT JOIN public.users u ON p.seller_id = u.id
        WHERE (p.is_available IS NULL OR p.is_available = true)
          AND COALESCE(p.is_deleted, false) = false
          AND COALESCE(p.is_hidden, false) = false
          AND COALESCE(u.is_active, true) = true
          AND COALESCE(u.is_suspended, false) = false;
      $sql$;

      RAISE NOTICE 'active_products_view has % dependent objects; created active_products_view_safe instead. Review and swap manually if desired.', dep_count;
    ELSE
      RAISE NOTICE 'active_products_view has % dependents and active_products_view_safe already exists; no changes made.', dep_count;
    END IF;
  END IF;
END$$;

-- NOTE: This view now uses LEFT JOIN and COALESCE to avoid excluding products when
-- the corresponding `users` row is missing. It preserves the original intent
-- to exclude products whose user profile is explicitly inactive or suspended.

DO $$
BEGIN
  RAISE NOTICE 'active_products_view recreated with LEFT JOIN and COALESCE defaults.';
END$$;
