-- 2026-01-16: Add last_auto_reply_at to conversations to track daily auto-replies
ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS last_auto_reply_at timestamptz;

-- Optional: Populate existing rows with NULL if needed (explicitly shown for clarity)
UPDATE public.conversations SET last_auto_reply_at = NULL WHERE last_auto_reply_at IS NULL;

-- Add minimal comment
COMMENT ON COLUMN public.conversations.last_auto_reply_at IS 'Timestamp of last automated reply sent for this conversation (used to limit replies to once per day)';
