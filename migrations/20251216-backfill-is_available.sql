-- Set default for is_available and backfill legacy NULLs
ALTER TABLE public.products
  ALTER COLUMN is_available SET DEFAULT true;

-- Backfill NULLs to true so older products become publicly visible if intended
UPDATE public.products
SET is_available = true
WHERE is_available IS NULL;

-- NOTE: Run this only if you confirm these rows should be available to the public.
-- Review affected rows first using:
-- SELECT id, title, seller_id, is_available, is_hidden, is_deleted FROM public.products WHERE is_available IS NULL OR is_available = false LIMIT 200;
