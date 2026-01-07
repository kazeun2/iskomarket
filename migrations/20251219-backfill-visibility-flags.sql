-- Add defaults and backfill NULL visibility flags so view and policies behave consistently
ALTER TABLE public.products
  ALTER COLUMN is_deleted SET DEFAULT false,
  ALTER COLUMN is_hidden SET DEFAULT false;

-- Backfill existing NULLs to safe defaults
UPDATE public.products SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE public.products SET is_hidden = false WHERE is_hidden IS NULL;

-- Ensure is_available default is true (idempotent)
ALTER TABLE public.products ALTER COLUMN is_available SET DEFAULT true;
UPDATE public.products SET is_available = true WHERE is_available IS NULL;

-- NOTE: Run this as an admin in Supabase SQL editor. Review affected rows prior to running if you need to exclude intentionally hidden or deleted items.
