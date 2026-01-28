-- Migration: 20260103-add-hard-delete-product.sql
-- Purpose: Add admin-only hard-delete RPC and extend admin_delete_cvsu_product to support hard deletes

BEGIN;

-- 1) Create hard_delete_product(p_id uuid)
CREATE OR REPLACE FUNCTION public.hard_delete_product(p_id uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  uid uuid := auth.uid();
  is_admin boolean := false;
  has_reported_product_id boolean := false;
BEGIN
  -- Verify caller is admin
  IF uid IS NULL THEN
    RAISE EXCEPTION 'must be admin to hard-delete product';
  END IF;

  SELECT COALESCE(u.is_admin,false) INTO is_admin FROM public.users u WHERE u.id = uid LIMIT 1;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'must be admin to hard-delete product';
  END IF;

  -- Safety checks: refuse to hard-delete if "important" dependent rows exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    IF EXISTS (SELECT 1 FROM public.transactions WHERE product_id = p_id) THEN
      RAISE EXCEPTION 'cannot hard-delete product: existing transactions';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reports') THEN
    -- Detect if the legacy `reported_product_id` column exists; if not fall back to the generic `reported_type`/`reported_id` form
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='reports' AND column_name='reported_product_id'
    ) INTO has_reported_product_id;

    IF has_reported_product_id THEN
      IF EXISTS (SELECT 1 FROM public.reports WHERE reported_product_id = p_id) THEN
        RAISE EXCEPTION 'cannot hard-delete product: existing reports';
      END IF;
    ELSE
      IF EXISTS (SELECT 1 FROM public.reports WHERE reported_type = 'product' AND reported_id = p_id) THEN
        RAISE EXCEPTION 'cannot hard-delete product: existing reports';
      END IF;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reviews') THEN
    IF EXISTS (SELECT 1 FROM public.reviews WHERE product_id = p_id) THEN
      RAISE EXCEPTION 'cannot hard-delete product: existing reviews';
    END IF;
  END IF;

  -- Best-effort cleanup of conversations/messages linked to this product
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    DELETE FROM public.messages WHERE product_id = p_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversations') THEN
    DELETE FROM public.conversations WHERE product_id = p_id;
  END IF;

  -- Archive or remove any attachments / product images if a helper table exists (best-effort)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='product_images') THEN
    DELETE FROM public.product_images WHERE product_id = p_id;
  END IF;

  -- Finally, delete the product
  DELETE FROM public.products WHERE id = p_id RETURNING id INTO p_id;

  IF NOT FOUND THEN
    -- If the product is already gone, return NULL
    RETURN NULL;
  END IF;

  RETURN p_id;
END;
$$;

-- Grant execute to authenticated (function enforces admin check internally)
GRANT EXECUTE ON FUNCTION public.hard_delete_product(uuid) TO authenticated;

-- 2) Replace admin_delete_cvsu_product to accept an optional hard flag
CREATE OR REPLACE FUNCTION public.admin_delete_cvsu_product(p_id uuid, p_hard boolean DEFAULT false)
  RETURNS TABLE(id uuid, product_id uuid, title text, description text, category text, images text[], created_at timestamptz, updated_at timestamptz)
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  deleted_row public.cvsu_market_products%ROWTYPE;  -- typed row to avoid RECORD ambiguity
  uid uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  -- Verify caller is an admin
  SELECT COALESCE(u.is_admin, false) INTO is_admin FROM public.users u WHERE u.id = uid LIMIT 1;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'must be admin to call admin_delete_cvsu_product';
  END IF;

  -- Attempt to delete the cvsu row and capture the deleted row (qualify table to avoid ambiguous column refs)
  DELETE FROM public.cvsu_market_products cm WHERE cm.id = p_id RETURNING * INTO deleted_row;

  IF NOT FOUND THEN
    RETURN; -- return empty set
  END IF;

  -- Best-effort: soft-delete or hard-delete linked product depending on flag
  IF deleted_row.product_id IS NOT NULL THEN
    IF p_hard THEN
      -- For hard delete, allow errors to propagate so admin sees the failure
      PERFORM public.hard_delete_product(deleted_row.product_id);
    ELSE
      BEGIN
        PERFORM public.delete_product_fallback(deleted_row.product_id::text, 'Deleted via admin_delete_cvsu_product');
      EXCEPTION WHEN OTHERS THEN
        -- swallow errors to avoid failing the cvsu delete if product RPC misbehaves
        RAISE NOTICE 'admin_delete_cvsu_product: failed to delete linked product: %', SQLERRM;
      END;
    END IF;
  END IF;

  -- Return the deleted row as explicit columns (registered types)
  RETURN QUERY SELECT deleted_row.id, deleted_row.product_id, deleted_row.title, deleted_row.description, deleted_row.category, deleted_row.images, deleted_row.created_at, deleted_row.updated_at;
END;
$$;

-- Ensure authenticated role can call it (function enforces admin check)
GRANT EXECUTE ON FUNCTION public.admin_delete_cvsu_product(uuid, boolean) TO authenticated;

COMMIT;
