-- 2026-01-06: add date_registered to public.users to satisfy auth trigger expectations
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS date_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing rows (if any) conservatively: use created_at if present, otherwise NOW().
UPDATE public.users
SET date_registered = COALESCE(date_registered, created_at, NOW())
WHERE date_registered IS NULL;
