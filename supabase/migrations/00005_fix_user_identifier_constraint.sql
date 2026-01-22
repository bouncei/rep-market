-- Fix user identifier constraint to include twitter_username
-- The original constraint only allowed twitter_id, but users can authenticate with twitter_username

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_has_identifier;

-- Add updated constraint that includes twitter_username
ALTER TABLE users ADD CONSTRAINT users_has_identifier
  CHECK (
    wallet_address IS NOT NULL
    OR twitter_id IS NOT NULL
    OR twitter_username IS NOT NULL
    OR google_id IS NOT NULL
  );

-- Add UNIQUE constraint on twitter_username to prevent duplicate users
-- First, we need to handle any existing duplicates before adding the constraint
-- This keeps only the oldest record for each twitter_username
DELETE FROM users a USING users b
WHERE a.twitter_username IS NOT NULL
  AND a.twitter_username = b.twitter_username
  AND a.created_at > b.created_at;

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_twitter_username_unique
  ON users(twitter_username)
  WHERE twitter_username IS NOT NULL;
