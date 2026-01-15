-- 2026-01-15: Add display_name, avatar_url, student_status to user_profile (if missing)

alter table if exists user_profile add column if not exists display_name text;
alter table if exists user_profile add column if not exists avatar_url text;
alter table if exists user_profile add column if not exists student_status text;
alter table if exists user_profile add column if not exists username text;

-- Indexes to speed up lookups
create index if not exists idx_user_profile_user_id on user_profile (user_id);
create index if not exists idx_user_profile_display_name on user_profile (display_name);

comment on table user_profile is 'User profile table used by apps; includes display_name, avatar_url, username for messaging and UI';
