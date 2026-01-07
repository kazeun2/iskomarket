-- 20260106-make-public-users-authoritative.sql
-- Idempotent migration to:
-- 1) Drop trigger/function that create rows in public.users from auth.users
-- 2) Ensure public.users has the requested schema (ADD columns if missing)
-- 3) Backfill email/username and make them NOT NULL + UNIQUE
-- 4) Add constraints and indexes (idempotent / safe to run multiple times)

-- --------------------------------------------------------------------------------
-- 1) Drop trigger and function if they exist (may require owner privileges)
-- --------------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop trigger if present
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trg_auth_create_user_profile' AND c.relname = 'users' AND c.relnamespace = 'auth'::regnamespace
  ) THEN
    RAISE NOTICE 'Dropping trigger trg_auth_create_user_profile on auth.users';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_auth_create_user_profile ON auth.users';
  END IF;

  -- Drop function if present
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'isk_create_user_profile' AND n.nspname = 'public'
  ) THEN
    RAISE NOTICE 'Dropping function public.isk_create_user_profile()';
    EXECUTE 'DROP FUNCTION IF EXISTS public.isk_create_user_profile() CASCADE';
  END IF;
END$$;

-- --------------------------------------------------------------------------------
-- 2) Backfill missing emails from auth.users (so email NOT NULL can be enforced)
-- --------------------------------------------------------------------------------
-- Copy missing emails from auth.users where id matches.
UPDATE public.users u
SET email = au.email
FROM auth.users au
WHERE (u.email IS NULL OR u.email = '')
  AND u.id = au.id;

-- For any remaining rows without an email (no matching auth user), set a placeholder.
UPDATE public.users
SET email = 'missing-email-' || substr(id::text,1,8) || '@invalid.local'
WHERE email IS NULL OR email = '';

-- --------------------------------------------------------------------------------
-- 3) Backfill missing username values (use local part of email) and avoid collisions
-- --------------------------------------------------------------------------------
WITH candidates AS (
  SELECT id, COALESCE(username, split_part(email, '@', 1)) AS base
  FROM public.users
  WHERE username IS NULL OR username = ''
),
resolved AS (
  SELECT
    c.id,
    CASE
      -- if base collides with any existing username (excluding this row), append short id suffix
      WHEN EXISTS (
        SELECT 1 FROM public.users u2 WHERE u2.username = c.base
      ) THEN c.base || '_' || substr(c.id::text,1,8)
      ELSE c.base
    END AS new_username
  FROM candidates c
)
UPDATE public.users u
SET username = r.new_username
FROM resolved r
WHERE u.id = r.id;

-- If any username still NULL (edge cases), set a safe fallback
UPDATE public.users
SET username = 'user_' || substr(id::text,1,8)
WHERE username IS NULL OR username = '';

-- --------------------------------------------------------------------------------
-- 4) Add missing columns (idempotent)
-- --------------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS program VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS college VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS iskoins INTEGER DEFAULT 50;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locked_iskoins INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_tier VARCHAR(20) DEFAULT 'Bronze';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS successful_transactions INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_top_buyer BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_top_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_trusted_member BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_season INTEGER DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS season_points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS season_rank INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_spin_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS spin_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_spins INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS glow_effect VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS glow_expiry TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS inactivity_warning_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS inactivity_warning_date TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure credit_score check exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_credit_score_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_credit_score_check CHECK (credit_score >= 0 AND credit_score <= 100);
  END IF;
END$$;

-- --------------------------------------------------------------------------------
-- 5) Ensure uniqueness indexes exist (idempotent) and set NOT NULL
-- --------------------------------------------------------------------------------
-- Lowercase indexes for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON public.users (lower(username));

-- Ensure email / username have non-null values
UPDATE public.users SET email = 'missing-email-' || substr(id::text,1,8) || '@invalid.local'
WHERE email IS NULL OR email = '';
UPDATE public.users SET username = 'user_' || substr(id::text,1,8)
WHERE username IS NULL OR username = '';

-- Finally set NOT NULL flags (safe because we've backfilled)
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;

-- --------------------------------------------------------------------------------
-- Done: final notice (wrapped inside DO block so it can run as a standalone script)
-- --------------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'public.users schema ensured, trigger/function removed (if present), username/email backfilled and NOT NULL constraints applied.';
END$$;
