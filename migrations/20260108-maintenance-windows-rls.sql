-- Migration: 20260108-maintenance-windows-rls.sql
-- Purpose: Enable RLS and add policies so that maintenance windows can only be managed by admins.

BEGIN;

-- Enable RLS for maintenance_windows (no-op if already enabled)
ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;

-- Drop any previous policies to make this idempotent
DROP POLICY IF EXISTS "Allow public select active maintenance windows" ON public.maintenance_windows;
DROP POLICY IF EXISTS "Admins can manage maintenance windows (insert)" ON public.maintenance_windows;
DROP POLICY IF EXISTS "Admins can manage maintenance windows (update)" ON public.maintenance_windows;
DROP POLICY IF EXISTS "Admins can manage maintenance windows (delete)" ON public.maintenance_windows;

-- Allow the public/anon role to SELECT only rows that are currently active
CREATE POLICY "Allow public select active maintenance windows"
  ON public.maintenance_windows
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated admin users to INSERT maintenance windows
CREATE POLICY "Admins can manage maintenance windows (insert)"
  ON public.maintenance_windows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Allow authenticated admin users to UPDATE maintenance windows
CREATE POLICY "Admins can manage maintenance windows (update)"
  ON public.maintenance_windows
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- Allow authenticated admin users to DELETE maintenance windows
CREATE POLICY "Admins can manage maintenance windows (delete)"
  ON public.maintenance_windows
  FOR DELETE
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

COMMIT;