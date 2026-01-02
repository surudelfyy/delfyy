-- Add default_context to profiles for user default decision context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_context TEXT;

