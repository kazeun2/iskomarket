-- Migration: 20260107-add-maintenance-type.sql
-- Purpose: Add `type` enum to `maintenance_windows` to support alerts and maintenance windows

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_window_type') THEN
    CREATE TYPE public.maintenance_window_type AS ENUM ('maintenance','alert');
  END IF;
END$$;

ALTER TABLE public.maintenance_windows
  ADD COLUMN IF NOT EXISTS type public.maintenance_window_type NOT NULL DEFAULT 'maintenance';

-- Backfill existing rows to 'maintenance'
UPDATE public.maintenance_windows SET type = 'maintenance' WHERE type IS NULL;

COMMIT;