-- supabase_remove_user_columns.sql
-- Removes deprecated columns from public.users table and associated indexes
-- Run in Supabase SQL editor as an admin

ALTER TABLE public.users DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS student_number;
ALTER TABLE public.users DROP COLUMN IF EXISTS year_level;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone_number;

-- Drop student_number index if present
DROP INDEX IF EXISTS idx_users_student_number;

-- Reminder: Review any database views or functions that referenced the removed columns
-- (for example, user_stats_view or active_products_view) and update them accordingly.