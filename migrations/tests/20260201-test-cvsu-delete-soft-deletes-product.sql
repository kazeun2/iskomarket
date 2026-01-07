-- Test: 20260201-test-cvsu-delete-soft-deletes-product.sql
-- Purpose: Ensure deleting a cvsu_market_products row marks linked product as soft-deleted (is_deleted = true)

DO $$
DECLARE
  test_prod_id uuid := gen_random_uuid();
  test_cvsu_id uuid := gen_random_uuid();
  default_seller uuid;
  temp_seller_created boolean := false;
BEGIN
  -- Find an admin user to be the seller; create one if none
  SELECT id INTO default_seller FROM public.users WHERE COALESCE(is_admin,false) = true LIMIT 1;
  IF default_seller IS NULL THEN
    INSERT INTO public.users (id, username, display_name, is_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test-cvsu-seller', 'Test Seller', true, now(), now())
    RETURNING id INTO default_seller;
    temp_seller_created := true;
  END IF;

  -- Insert a canonical product
  INSERT INTO public.products (id, title, description, seller_id, price, condition, is_cvsu_only, is_available, is_hidden, is_deleted, views, interested, created_at, updated_at)
  VALUES (test_prod_id, 'test-soft-delete-product', 'test product description', default_seller, 0, 'Not specified', true, true, false, false, 0, 0, now(), now());

  -- Insert a cvsu row referencing the product
  INSERT INTO public.cvsu_market_products (id, product_id, title, description, category, images, created_at, updated_at)
  VALUES (test_cvsu_id, test_prod_id, 'test-cvsu-soft-delete', 'test description', 'CvSU Test', ARRAY[]::text[], now(), now());

  -- Perform a plain DELETE from cvsu table (simulates UI delete)
  DELETE FROM public.cvsu_market_products WHERE id = test_cvsu_id;

  -- Verify cvsu row gone
  IF EXISTS (SELECT 1 FROM public.cvsu_market_products WHERE id = test_cvsu_id) THEN
    RAISE EXCEPTION 'Test failed: cvsu row still exists after delete';
  END IF;

  -- Verify product marked deleted (soft-delete)
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = test_prod_id AND is_deleted = true) THEN
    RAISE EXCEPTION 'Test failed: product was not soft-deleted by cvsu deletion';
  END IF;

  -- Cleanup
  DELETE FROM public.products WHERE id = test_prod_id;
  IF temp_seller_created THEN
    DELETE FROM public.users WHERE id = default_seller;
  END IF;

  RAISE NOTICE 'TEST PASSED: cvsu deletion soft-deletes linked product as expected';
END $$;
