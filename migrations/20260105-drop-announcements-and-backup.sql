-- Migration: 20260105-drop-announcements-and-backup.sql
-- Purpose: Remove legacy announcement tables and the season leaderboard backup table, and remove associated RLS policies safely

BEGIN;

-- SAFETY NOTES:
-- 1) This migration will DROP the following tables (if they exist):
--      - announcements
--      - announcement_views
--      - season_leaderboard_backup
--    `CASCADE` is used to also drop dependent objects. Take a DB backup (pg_dump) before running in production.
--
-- 2) We check and remove any row-level security (RLS) policies on these tables prior to dropping them to leave a clean state.
--
-- 3) This migration intentionally **does NOT** drop `moderation_logs` (admin action audit trail). Review `moderation_logs` vs `system_logs` and the new `admin_audit_logs` (if present) to decide whether deduplication or consolidation is desired before removing any audit table.

-- Remove policies and disable RLS for announcements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'announcements') THEN
    -- Drop known policies on announcements (safe no-op with IF EXISTS)
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements';
    -- Disable RLS (no-op if already disabled)
    EXECUTE 'ALTER TABLE announcements DISABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- Remove policies and disable RLS for announcement_views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'announcement_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can create own announcement views" ON announcement_views';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own announcement views" ON announcement_views';
    EXECUTE 'ALTER TABLE announcement_views DISABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- Remove policies and disable RLS for season_leaderboard_backup (backup table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'season_leaderboard_backup') THEN
    -- In many setups the backup table won't have policies, but drop defensively
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view leaderboard" ON season_leaderboard_backup';
    EXECUTE 'ALTER TABLE season_leaderboard_backup DISABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- Finally drop the tables (cascade to remove dependents)
DROP TABLE IF EXISTS announcement_views CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS season_leaderboard_backup CASCADE;

COMMIT;

-- === ROLLBACK / NOTES ===
-- To restore data if needed, restore from DB dump or previously-created backup tables.
-- If you only need to remove the UI and keep historical data, consider moving rows into an archived table instead of dropping.

-- === AUDIT LOGS / RLS CONSIDERATIONS ===
-- "moderation_logs" is present in the schema and already provides an admin-visible audit trail (with RLS policies restricting SELECT/INSERT to admin users). Because that table stores admin actions, dropping announcements-related audit history should be considered carefully.
-- "system_logs" is a separate table used for system monitoring and typically does not have RLS enabled in this project (see migration 20251228-create-system-logs.sql). If you want to restrict reads/inserts to admin/service roles, consider enabling RLS on system_logs and adding policies that allow only server-side roles or admins to insert/read.
-- Example optional RLS snippet for system_logs (run separately if you decide to lock it down):
--
-- BEGIN;
-- ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT
--   USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
-- CREATE POLICY "Server can insert system logs" ON public.system_logs FOR INSERT
--   WITH CHECK (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
-- COMMIT;
--
-- Note: Replace the `WITH CHECK` condition above with your environment's preferred server/auth checks. Test in staging before applying in production.
