-- Add canonical `name` column to users and backfill from username
-- Safe to run multiple times (idempotent)
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name VARCHAR;

-- Backfill name from username where not present
UPDATE public.users
SET name = username
WHERE (name IS NULL OR name = '') AND (username IS NOT NULL AND username <> '');

-- Optionally keep username as legacy column for compatibility
-- We intentionally do not DROP the username column here

COMMIT;