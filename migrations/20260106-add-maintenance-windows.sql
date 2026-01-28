-- Migration: 20260106-add-maintenance-windows.sql
-- Purpose: Add `maintenance_windows` table for scheduled maintenance windows and ensure it's included in supabase_realtime publication

BEGIN;

CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'System Maintenance',
  message text NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active maintenance window allowed at a time (partial unique index)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'maintenance_windows_single_active_idx'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX maintenance_windows_single_active_idx ON public.maintenance_windows ((is_active)) WHERE (is_active = true)';
  END IF;
END$$;

-- Ensure table is part of the supabase_realtime publication so realtime will emit changes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_windows';
    EXCEPTION WHEN duplicate_object THEN
      -- already added, ignore
      NULL;
    END;
  END IF;
END$$;

COMMIT;