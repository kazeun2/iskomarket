-- Migration: Allow authenticated users to insert/select storage.objects for the 'product-images' bucket
-- Purpose: Fix 'new row violates row-level security' errors observed when clients upload images to storage

BEGIN;

-- Allow authenticated users to INSERT objects into the product-images bucket
CREATE POLICY allow_authenticated_insert_product_images
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to SELECT objects metadata in the product-images bucket
CREATE POLICY allow_authenticated_select_product_images
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

COMMIT;

-- Note: Applying this migration requires an admin with access to your Supabase SQL editor.
-- If your desired strategy is to make the bucket public instead, set the bucket's public flag via Supabase Console.
