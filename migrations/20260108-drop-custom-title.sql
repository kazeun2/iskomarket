-- 20260108 - Drop custom_title column from users table
-- Destructive migration: removes the `custom_title` column and its data

BEGIN;

ALTER TABLE users DROP COLUMN IF EXISTS custom_title;

COMMIT;