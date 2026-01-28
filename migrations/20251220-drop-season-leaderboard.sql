-- Migration: Drop season_leaderboard (backup and drop)
-- Generated: 2025-12-20

-- Safety: wrap in transaction
BEGIN;

-- 1) Create a full backup table (if not exists) so data can be restored
DROP TABLE IF EXISTS season_leaderboard_backup;
CREATE TABLE season_leaderboard_backup AS TABLE season_leaderboard WITH DATA;

-- 2) Remove RLS policies associated with the table (if present)
-- Use a conditional block because `DROP POLICY ... ON <table>` fails if the table doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'season_leaderboard') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view leaderboard" ON season_leaderboard';
  END IF;
END
$$;

-- 3) Drop the table
DROP TABLE IF EXISTS season_leaderboard CASCADE;

COMMIT;

-- === ROLLBACK / RESTORE intructions ===
-- To restore the table structure and data (manual rollback), run the following in a safe maintenance window:
--
-- BEGIN;
--
-- -- Recreate table (schema must match original; adjust types if schema changed)
-- CREATE TABLE season_leaderboard (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   total_points INTEGER DEFAULT 0,
--   final_rank INTEGER,
--   transactions_completed INTEGER DEFAULT 0,
--   items_sold INTEGER DEFAULT 0,
--   items_purchased INTEGER DEFAULT 0,
--   iskoins_earned INTEGER DEFAULT 0,
--   reward_iskoins INTEGER DEFAULT 0,
--   reward_badges JSONB DEFAULT '[]',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   UNIQUE(season_id, user_id)
-- );
--
-- -- Recreate policies (if desired)
-- ALTER TABLE season_leaderboard ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can view leaderboard" ON season_leaderboard FOR SELECT USING (true);
--
-- -- Reinsert data (if backup exists)
-- INSERT INTO season_leaderboard SELECT * FROM season_leaderboard_backup;
--
-- COMMIT;

-- NOTE: It's recommended to take a DB backup (pg_dump) before running this migration in production.