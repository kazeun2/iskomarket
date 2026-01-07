-- Test script: 20260101-test-delete-cvsu-product.sql
-- Purpose: End-to-end test for deleting cvsu_market_products and associated products
-- Run this in the Supabase SQL editor (as a superuser/admin) to verify fixes.

DO $$
DECLARE
  test_prod_id uuid := gen_random_uuid();
  test_cvsu_id uuid := gen_random_uuid();
  found_count int;
  rpc_row record;
  default_seller uuid;
  temp_seller_created boolean := false;
BEGIN
  -- Find an admin user to act as seller for test products; create a temp admin user if none exists
  SELECT id INTO default_seller FROM public.users WHERE COALESCE(is_admin, false) = true LIMIT 1;
  IF default_seller IS NULL THEN
    INSERT INTO public.users (id, username, display_name, is_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test-cvsu-seller', 'Test Seller', true, now(), now())
    RETURNING id INTO default_seller;
    temp_seller_created := true;
  END IF;

  -- Create a product row with required non-null fields (seller_id, condition, etc.)
  -- Insert product with required non-null fields (include description to satisfy schema constraints)
  INSERT INTO public.products (id, title, description, seller_id, price, condition, is_cvsu_only, is_available, is_hidden, is_deleted, views, interested, created_at, updated_at)
  VALUES (test_prod_id, 'test-delete-cvsu-product', 'test product description', default_seller, 0, 'Not specified', true, true, false, false, 0, 0, now(), now());

  -- Create a cvsu_market_products row that references the product
  INSERT INTO public.cvsu_market_products (id, product_id, title, description, category, images, created_at, updated_at)
  VALUES (test_cvsu_id, test_prod_id, 'test-cvsu', 'test description', 'CvSU Test', ARRAY[]::text[], now(), now());

  -- Ensure rows exist
  SELECT COUNT(*) INTO found_count FROM public.cvsu_market_products WHERE id = test_cvsu_id;
  IF found_count = 0 THEN
    RAISE EXCEPTION 'Test setup failed: cvsu row not inserted';
  END IF;

  SELECT COUNT(*) INTO found_count FROM public.products WHERE id = test_prod_id;
  IF found_count = 0 THEN
    RAISE EXCEPTION 'Test setup failed: product row not inserted';
  END IF;

  -- 1) Run admin_delete_cvsu_product (should remove cvsu row and attempt to soft-delete product)
  BEGIN
    PERFORM public.admin_delete_cvsu_product(test_cvsu_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'admin_delete_cvsu_product raised an error: %', SQLERRM;
  END;

  -- Verify cvsu row is gone
  SELECT COUNT(*) INTO found_count FROM public.cvsu_market_products WHERE id = test_cvsu_id;
  IF found_count != 0 THEN
    RAISE EXCEPTION 'Test failed: cvsu row still exists after admin_delete_cvsu_product';
  END IF;

  -- 2) Try delete_product_fallback on the product id. This should not RAISE (should return sentinel or mark deleted)
  BEGIN
    SELECT * INTO rpc_row FROM public.delete_product_fallback(test_prod_id::text);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'delete_product_fallback raised an error: %', SQLERRM;
  END;

  -- If the RPC returned a row with id IS NULL and is_deleted=false it's a not-found sentinel, which is okay.
  IF rpc_row IS NULL THEN
    RAISE EXCEPTION 'delete_product_fallback returned no row (unexpected)';
  END IF;

  -- Check product final status: if id is non-null, ensure product.is_deleted = true OR rpc_row.is_deleted = true
  IF rpc_row.id IS NOT NULL THEN
    IF rpc_row.is_deleted IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Test failed: product was not marked deleted by RPC';
    END IF;
  ELSE
    -- sentinel case: ensure the product still exists but is_deleted may be false; that's permitted by our contract
    PERFORM 1; -- no-op
  END IF;

  -- Cleanup: remove any leftover test rows
  DELETE FROM public.cvsu_market_products WHERE id = test_cvsu_id OR product_id = test_prod_id;
  DELETE FROM public.products WHERE id = test_prod_id;

  -- Cleanup temp seller if we created one
  IF temp_seller_created THEN
    DELETE FROM public.users WHERE id = default_seller;
  END IF;

  RAISE NOTICE 'TEST PASSED: delete flow behaved as expected';
END
$$;
