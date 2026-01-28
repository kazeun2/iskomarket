-- Migration: 20251224-delete-product-105.sql
-- Purpose: Permanently mark product with legacy id 105 as deleted using the safe
-- delete function so clients and seeds won't re-create or show it.

-- Use the robust fallback RPC that handles UUIDs and legacy numeric ids
BEGIN;

-- Mark product 105 as deleted and set a clear deletion_reason for auditability
SELECT * FROM public.delete_product_fallback('105', 'Removed by migration 20251224-delete-product-105.sql');

COMMIT;

-- Notes:
-- - This uses the existing SECURITY DEFINER function added in
--   20251224-delete-product-fallback.sql which accepts textual ids and
--   updates the correct row whether the products table stores a UUID or a
--   legacy numeric id column.
-- - If you want a hard-delete (remove row entirely), we can extend this
--   migration after review to DELETE FROM public.products WHERE id::text = '105' OR legacy_id = 105;
