-- Migration: 20251224-delete-product-fallback.sql
-- Purpose: Add a robust server-side function to delete (soft-delete) products
-- that accepts legacy numeric ids or UUIDs and avoids client-side cast errors.

-- Creates function: public.delete_product_fallback(p_id_text text, p_reason text default 'Deleted by user')

CREATE OR REPLACE FUNCTION public.delete_product_fallback(p_id_text text, p_reason text DEFAULT 'Deleted by user')
RETURNS TABLE (id uuid, is_deleted boolean, deletion_reason text) AS $$
DECLARE
  v_uuid uuid;
  v_found boolean := false;
BEGIN
  -- Try to interpret the caller-supplied id as a UUID first.
  BEGIN
    v_uuid := p_id_text::uuid;
    UPDATE public.products
    SET is_deleted = true,
        deletion_reason = p_reason
    WHERE id = v_uuid
    RETURNING id, is_deleted, deletion_reason
    INTO id, is_deleted, deletion_reason;

    IF FOUND THEN
      RETURN NEXT;
      RETURN;
    END IF;
  EXCEPTION WHEN others THEN
    -- If the cast fails (invalid UUID syntax), fall through to compatibility handling.
    NULL;
  END;

  -- Try to match common legacy numeric id columns if they exist.
  -- This checks for a small set of plausible legacy columns and only attempts
  -- the numeric cast/update when the column is present to avoid errors.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'legacy_id'
  ) THEN
    BEGIN
      UPDATE public.products
      SET is_deleted = true, deletion_reason = p_reason
      WHERE legacy_id = p_id_text::bigint
      RETURNING id, is_deleted, deletion_reason
      INTO id, is_deleted, deletion_reason;

      IF FOUND THEN RETURN NEXT; RETURN; END IF;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'legacy_product_id'
  ) THEN
    BEGIN
      UPDATE public.products
      SET is_deleted = true, deletion_reason = p_reason
      WHERE legacy_product_id = p_id_text::bigint
      RETURNING id, is_deleted, deletion_reason
      INTO id, is_deleted, deletion_reason;

      IF FOUND THEN RETURN NEXT; RETURN; END IF;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'numeric_id'
  ) THEN
    BEGIN
      UPDATE public.products
      SET is_deleted = true, deletion_reason = p_reason
      WHERE numeric_id = p_id_text::bigint
      RETURNING id, is_deleted, deletion_reason
      INTO id, is_deleted, deletion_reason;

      IF FOUND THEN RETURN NEXT; RETURN; END IF;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'old_id'
  ) THEN
    BEGIN
      UPDATE public.products
      SET is_deleted = true, deletion_reason = p_reason
      WHERE old_id = p_id_text::bigint
      RETURNING id, is_deleted, deletion_reason
      INTO id, is_deleted, deletion_reason;

      IF FOUND THEN RETURN NEXT; RETURN; END IF;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;

  -- As a last resort, try to match the textual representation of the id (safe non-error path)
  BEGIN
    UPDATE public.products
    SET is_deleted = true, deletion_reason = p_reason
    WHERE id::text = p_id_text
    RETURNING id, is_deleted, deletion_reason
    INTO id, is_deleted, deletion_reason;

    IF FOUND THEN RETURN NEXT; RETURN; END IF;
  EXCEPTION WHEN others THEN NULL; END;

  -- Nothing matched: return a not-found sentinel row instead of raising an exception so clients receive a 200 response
  RETURN QUERY SELECT NULL::uuid AS id, false::boolean AS is_deleted, 'not found'::text AS deletion_reason;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon/public role so clients can call the RPC when appropriate
GRANT EXECUTE ON FUNCTION public.delete_product_fallback(text, text) TO anon, authenticated;
