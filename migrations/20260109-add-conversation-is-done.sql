-- Add is_done flag to conversations to allow clients and server automations to ignore archived/done conversations
ALTER TABLE conversations
  ADD COLUMN is_done BOOLEAN DEFAULT FALSE;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_conversations_is_done ON conversations(is_done);
