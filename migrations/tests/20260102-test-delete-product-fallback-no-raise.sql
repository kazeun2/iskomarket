-- Test: 20260102-test-delete-product-fallback-no-raise.sql
-- Purpose: Ensure delete_product_fallback does not RAISE when called with a missing id

DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  rpc_row record;
BEGIN
  -- Ensure the id does not exist (best-effort cleanup)
  DELETE FROM public.products WHERE id = test_id;

  -- Call the RPC and ensure it does not raise
  BEGIN
    SELECT * INTO rpc_row FROM public.delete_product_fallback(test_id::text);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'delete_product_fallback raised an error: %', SQLERRM;
  END;

  IF rpc_row IS NULL THEN
    RAISE EXCEPTION 'delete_product_fallback returned no row (unexpected)';
  END IF;

  -- Expect the not-found sentinel when product does not exist
  IF rpc_row.id IS NOT NULL OR rpc_row.is_deleted IS DISTINCT FROM false OR rpc_row.deletion_reason IS DISTINCT FROM 'not found' THEN
    RAISE EXCEPTION 'Test failed: expected not-found sentinel for missing id, got: %', rpc_row;
  END IF;

  RAISE NOTICE 'TEST PASSED: delete_product_fallback does not raise and returns sentinel for missing id';
END $$;
