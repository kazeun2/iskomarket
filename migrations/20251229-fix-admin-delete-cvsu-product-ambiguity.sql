-- Migration: 20251229-fix-admin-delete-cvsu-product-ambiguity.sql
-- Purpose: Fix ambiguous column reference in admin_delete_cvsu_product by
-- qualifying the table column or renaming the parameter so DELETE won't fail.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_cvsu_product(p_row_id uuid)
  RETURNS TABLE(id uuid, product_id uuid, title text, description text, category text, images text[], created_at timestamptz, updated_at timestamptz)
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  deleted_row RECORD;
  uid uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  -- Verify caller is an admin
  SELECT COALESCE(u.is_admin, false) INTO is_admin FROM public.users u WHERE u.id = uid LIMIT 1;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'must be admin to call admin_delete_cvsu_product';
  END IF;

  -- Attempt to delete the cvsu row and capture the deleted row
  -- Qualify the table column name to avoid ambiguity with function output columns
  DELETE FROM public.cvsu_market_products cm WHERE cm.id = p_row_id RETURNING * INTO deleted_row;

  IF NOT FOUND THEN
    RETURN; -- return empty set
  END IF;

  -- Best-effort: soft-delete linked product (ignore errors)
  BEGIN
    IF deleted_row.product_id IS NOT NULL THEN
      PERFORM public.delete_product_fallback(deleted_row.product_id::text, 'Deleted via admin_delete_cvsu_product');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- swallow errors to avoid failing the delete if product RPC misbehaves
    RAISE NOTICE 'admin_delete_cvsu_product: failed to delete linked product: %', SQLERRM;
  END;

  RETURN QUERY SELECT deleted_row.*;
END;
$$;

-- Grant execute to authenticated role so clients can call it (policy check inside function enforces admin only)
GRANT EXECUTE ON FUNCTION public.admin_delete_cvsu_product(uuid) TO authenticated;

COMMIT;

-- Quick verification (run in the SQL editor as an admin user):
-- 1) SELECT * FROM public.admin_delete_cvsu_product('<CVSU_UUID>'); -- should return the deleted row or empty set and not throw 'ambiguous column' error
-- 2) DELETE FROM public.cvsu_market_products WHERE id = '<CVSU_UUID>' RETURNING *; -- should succeed even if linked product delete fails (after tolerant trigger migration)
