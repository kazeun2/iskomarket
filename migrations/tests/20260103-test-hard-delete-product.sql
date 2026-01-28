-- Test: 20260103-test-hard-delete-product.sql
-- Purpose: Ensure admin hard-delete removes product when allowed and refuses when blocked by dependent rows

DO $$
DECLARE
  test_prod_id uuid := gen_random_uuid();
  test_cvsu_id uuid := gen_random_uuid();
  test_buyer uuid := gen_random_uuid();
  rpc_row record;
  default_seller uuid;
  temp_seller_created boolean := false;
  temp_buyer_created boolean := false;
BEGIN
  -- Create an admin user (if none exists) to run admin-only RPCs and ensure buyer/seller exist for FK constraints
  SELECT id INTO default_seller FROM public.users WHERE COALESCE(is_admin,false) = true LIMIT 1;
  IF default_seller IS NULL THEN
    INSERT INTO public.users (id, username, email, is_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test-hard-delete-seller', 'test-hard-delete-seller@example.com', true, now(), now())
    RETURNING id INTO default_seller;
    temp_seller_created := true;
  END IF;
  -- Ensure auth.uid() resolves to the admin user for the test (set session JWT claims for this DO block)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', default_seller::text)::text, true);
  -- Ensure a buyer user exists for transactions if the transactions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    -- Use the pre-generated test_buyer id, inserting a user record if necessary
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = test_buyer) THEN
      INSERT INTO public.users (id, username, email, created_at, updated_at)
      VALUES (test_buyer, 'test-hard-delete-buyer', 'test-hard-delete-buyer@example.com', now(), now());
      temp_buyer_created := true;
    END IF;
  END IF;

  -- Create a product row (use a valid seller id to satisfy FK)
  INSERT INTO public.products (id, title, description, seller_id, price, condition, is_cvsu_only, is_available, is_hidden, is_deleted, views, interested, created_at, updated_at)
  VALUES (test_prod_id, 'test-hard-delete-product', 'test product description', default_seller, 0, 'Not specified', true, true, false, false, 0, 0, now(), now());

  -- Create a cvsu row referencing product
  INSERT INTO public.cvsu_market_products (id, product_id, title, description, category, images, created_at, updated_at)
  VALUES (test_cvsu_id, test_prod_id, 'test-cvsu', 'test description', 'CvSU Test', ARRAY[]::text[], now(), now());

  -- 1) Try hard delete while a transaction exists -> expect failure
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    INSERT INTO public.transactions (product_id, buyer_id, seller_id, amount, status) VALUES (test_prod_id, test_buyer, default_seller, 0, 'pending');

    BEGIN
      PERFORM public.admin_delete_cvsu_product(test_cvsu_id, true);
      RAISE EXCEPTION 'Test failed: hard delete should have refused when transactions existed';
    EXCEPTION WHEN OTHERS THEN
      -- Hard-delete failed as expected. Ensure transaction still exists and product was not removed.
      IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE product_id = test_prod_id) THEN
        RAISE EXCEPTION 'Test failed: expected transaction to exist blocking hard delete, got: %', SQLERRM;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = test_prod_id) THEN
        RAISE EXCEPTION 'Test failed: expected product to still exist after blocked hard delete';
      END IF;
    END;

    -- Cleanup transaction
    DELETE FROM public.transactions WHERE product_id = test_prod_id;
  END IF;

  -- 2) Now hard-delete should succeed
  PERFORM public.admin_delete_cvsu_product(test_cvsu_id, true);

  -- Verify cvsu row removed
  IF EXISTS (SELECT 1 FROM public.cvsu_market_products WHERE id = test_cvsu_id) THEN
    RAISE EXCEPTION 'Test failed: cvsu row still exists after hard delete';
  END IF;

  -- Verify product removed
  IF EXISTS (SELECT 1 FROM public.products WHERE id = test_prod_id) THEN
    RAISE EXCEPTION 'Test failed: product row still exists after hard delete';
  END IF;

  -- Clear session-level jwt claim set for this test
  PERFORM set_config('request.jwt.claims', '', true);

  -- Cleanup created test users if we created them
  IF temp_buyer_created THEN
    DELETE FROM public.users WHERE id = test_buyer;
  END IF;

  IF temp_seller_created THEN
    DELETE FROM public.users WHERE id = default_seller;
  END IF;

  RAISE NOTICE 'TEST PASSED: hard-delete behavior as expected';
END $$;
