-- Add social authentication columns to users table
-- Supports Twitter/X and Google authentication via Privy

-- Add auth provider column
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'wallet';

-- Add Twitter/X authentication columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username TEXT;

-- Add Google authentication columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Make wallet_address nullable for social auth users
ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;

-- Add constraint to ensure at least one identifier exists
ALTER TABLE users ADD CONSTRAINT users_has_identifier
  CHECK (wallet_address IS NOT NULL OR twitter_id IS NOT NULL OR google_id IS NOT NULL);

-- Create indexes for social auth lookups
CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users(twitter_id) WHERE twitter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_twitter_username ON users(twitter_username) WHERE twitter_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Update RLS policy for users to handle social auth
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id'
    OR google_id = current_setting('request.jwt.claims', true)::json->>'google_id'
  )
  WITH CHECK (
    wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id'
    OR google_id = current_setting('request.jwt.claims', true)::json->>'google_id'
  );
