-- Migration: 20251227-add-admin-delete-cvsu-product.sql
-- Purpose: Provide an admin-only, SECURITY DEFINER RPC to remove a cvsu_market_products row
-- and (best-effort) soft-delete any linked product using the existing delete_product_fallback.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_cvsu_product(p_id uuid)
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
  DELETE FROM public.cvsu_market_products WHERE id = p_id RETURNING * INTO deleted_row;

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
