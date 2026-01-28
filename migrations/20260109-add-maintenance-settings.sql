-- Migration: 20260109-add-maintenance-settings.sql
-- Purpose: Add `maintenance_settings` singleton table and RLS policies

BEGIN;

CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Scheduled maintenance',
  message text NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Seed a single row for backwards compatibility / simple management
INSERT INTO public.maintenance_settings (is_active, title, message)
VALUES (false, 'Scheduled maintenance', 'IskoMarket will be temporarily unavailable.')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to SELECT only active row(s)
DROP POLICY IF EXISTS "Public can select active maintenance settings" ON public.maintenance_settings;
CREATE POLICY "Public can select active maintenance settings"
  ON public.maintenance_settings
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated admins to UPDATE the singleton row
DROP POLICY IF EXISTS "Admins can manage maintenance settings" ON public.maintenance_settings;
CREATE POLICY "Admins can manage maintenance settings"
  ON public.maintenance_settings
  FOR ALL
  TO authenticated
  USING (
    -- allow SELECT for everyone via separate policy; restrict other operations to admins
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true)
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true)
  );

COMMIT;