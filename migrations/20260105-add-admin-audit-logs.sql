-- Migration: 20260105-add-admin-audit-logs.sql
-- Purpose: Add admin_audit_logs table to record administrative actions and enable realtime subscriptions

BEGIN;

-- Create enum types for action and target_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_audit_action') THEN
    CREATE TYPE public.admin_audit_action AS ENUM ('deleted','suspended','approved','declined','warned','removed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_audit_target') THEN
    CREATE TYPE public.admin_audit_target AS ENUM ('product','user','fundraiser','for_a_cause','account');
  END IF;
END$$;

-- Create table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NULL,
  admin_email text NULL,
  action public.admin_audit_action NOT NULL,
  target_type public.admin_audit_target NOT NULL,
  target_id text NULL,
  target_title text NULL,
  reason text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_action_idx ON public.admin_audit_logs (action);

-- Ensure the table is part of the supabase_realtime publication so realtime will emit changes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs';
    EXCEPTION WHEN duplicate_object THEN
      -- already added, ignore
      NULL;
    END;
  END IF;
END$$;

COMMIT;
