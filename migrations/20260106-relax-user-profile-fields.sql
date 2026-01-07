-- 2026-01-06: relax non-essential constraints on public.users
-- Purpose: allow application upserts after verifyOtp to succeed even when only id/email/username are provided.
-- Safe to run as project owner in Supabase Cloud (no auth schema owner actions required).

-- Remove NOT NULL requirement for program and college so an explicit null won't cause an insert to fail.
ALTER TABLE public.users ALTER COLUMN program DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN college DROP NOT NULL;

-- Add conservative defaults (empty string) for new rows inserted without these fields.
ALTER TABLE public.users ALTER COLUMN program SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN college SET DEFAULT '';

-- Backfill existing rows that may have NULL program/college with empty string for consistency.
UPDATE public.users SET program = '' WHERE program IS NULL;
UPDATE public.users SET college = '' WHERE college IS NULL;
