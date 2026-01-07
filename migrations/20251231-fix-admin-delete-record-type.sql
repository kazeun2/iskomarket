-- Migration: 20251231-fix-admin-delete-record-type.sql
-- Purpose: Fix "record type has not been registered" when returning deleted_row from
-- admin_delete_cvsu_product by using a typed row variable and returning explicit columns.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_cvsu_product(p_id uuid)
  RETURNS TABLE(id uuid, product_id uuid, title text, description text, category text, images text[], created_at timestamptz, updated_at timestamptz)
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  deleted_row public.cvsu_market_products%ROWTYPE;  -- typed row to avoid unregistered RECORD issues
  uid uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  -- Verify caller is an admin
  SELECT COALESCE(u.is_admin, false) INTO is_admin FROM public.users u WHERE u.id = uid LIMIT 1;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'must be admin to call admin_delete_cvsu_product';
  END IF;

  -- Attempt to delete the cvsu row and capture the deleted row
  DELETE FROM public.cvsu_market_products cm WHERE cm.id = p_id RETURNING * INTO deleted_row;

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

  -- Return the deleted row as explicit columns (registered types)
  RETURN QUERY SELECT deleted_row.id, deleted_row.product_id, deleted_row.title, deleted_row.description, deleted_row.category, deleted_row.images, deleted_row.created_at, deleted_row.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_cvsu_product(uuid) TO authenticated;

COMMIT;

-- Verification:
-- SELECT * FROM public.admin_delete_cvsu_product('<CVSU_UUID>'); -- Should return the deleted row or empty set and not error
-- DELETE FROM public.cvsu_market_products WHERE id = '<CVSU_UUID>' RETURNING *; -- direct delete should also succeed (trigger is tolerant)
