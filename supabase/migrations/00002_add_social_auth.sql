-- Add Social OAuth Support Migration
-- Phase 2: Social Authentication

-- ============================================
-- MODIFY USERS TABLE FOR SOCIAL AUTH
-- ============================================

-- Make wallet_address nullable since social auth users won't have one
ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;

-- Add social auth provider fields
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN google_email TEXT;
ALTER TABLE users ADD COLUMN twitter_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN twitter_username TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'wallet' CHECK (auth_provider IN ('wallet', 'google', 'twitter'));

-- Update indexes for new auth methods
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_twitter_id ON users(twitter_id) WHERE twitter_id IS NOT NULL;
CREATE INDEX idx_users_auth_provider ON users(auth_provider);

-- ============================================
-- UPDATE RLS POLICIES FOR SOCIAL AUTH
-- ============================================

-- Drop old user policies that only worked with wallet addresses
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- New policies that work with both wallet and social auth
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (
    -- For wallet auth: wallet_address matches
    (auth_provider = 'wallet' AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
    -- For Google auth: google_id matches
    (auth_provider = 'google' AND google_id = current_setting('request.jwt.claims', true)::json->>'google_id') OR
    -- For Twitter auth: twitter_id matches
    (auth_provider = 'twitter' AND twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id')
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (
    -- For wallet auth: wallet_address matches
    (auth_provider = 'wallet' AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
    -- For Google auth: google_id matches
    (auth_provider = 'google' AND google_id = current_setting('request.jwt.claims', true)::json->>'google_id') OR
    -- For Twitter auth: twitter_id matches
    (auth_provider = 'twitter' AND twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id')
  )
  WITH CHECK (
    -- For wallet auth: wallet_address matches
    (auth_provider = 'wallet' AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
    -- For Google auth: google_id matches
    (auth_provider = 'google' AND google_id = current_setting('request.jwt.claims', true)::json->>'google_id') OR
    -- For Twitter auth: twitter_id matches
    (auth_provider = 'twitter' AND twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id')
  );

-- Update credibility sync logs policy to work with social auth
DROP POLICY IF EXISTS "Users can view their own sync logs" ON credibility_sync_logs;

CREATE POLICY "Users can view their own sync logs"
  ON credibility_sync_logs FOR SELECT
  USING (user_id IN (
    SELECT id FROM users
    WHERE
      -- For wallet auth: wallet_address matches
      (auth_provider = 'wallet' AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
      -- For Google auth: google_id matches
      (auth_provider = 'google' AND google_id = current_setting('request.jwt.claims', true)::json->>'google_id') OR
      -- For Twitter auth: twitter_id matches
      (auth_provider = 'twitter' AND twitter_id = current_setting('request.jwt.claims', true)::json->>'twitter_id')
  ));

-- ============================================
-- UPDATE FUNCTIONS FOR SOCIAL AUTH
-- ============================================

-- Function to create or get user by auth method
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_wallet_address TEXT DEFAULT NULL,
  p_google_id TEXT DEFAULT NULL,
  p_google_email TEXT DEFAULT NULL,
  p_twitter_id TEXT DEFAULT NULL,
  p_twitter_username TEXT DEFAULT NULL
) RETURNS users AS $$
DECLARE
  v_user users;
  v_auth_provider TEXT;
BEGIN
  -- Determine auth provider
  IF p_wallet_address IS NOT NULL THEN
    v_auth_provider := 'wallet';
  ELSIF p_google_id IS NOT NULL THEN
    v_auth_provider := 'google';
  ELSIF p_twitter_id IS NOT NULL THEN
    v_auth_provider := 'twitter';
  ELSE
    RAISE EXCEPTION 'Must provide wallet_address, google_id, or twitter_id';
  END IF;

  -- Try to find existing user
  SELECT * INTO v_user FROM users
  WHERE
    (wallet_address = p_wallet_address AND p_wallet_address IS NOT NULL) OR
    (google_id = p_google_id AND p_google_id IS NOT NULL) OR
    (twitter_id = p_twitter_id AND p_twitter_id IS NOT NULL)
  LIMIT 1;

  -- If user doesn't exist, create them
  IF v_user IS NULL THEN
    INSERT INTO users (
      wallet_address,
      google_id,
      google_email,
      twitter_id,
      twitter_username,
      auth_provider
    ) VALUES (
      p_wallet_address,
      p_google_id,
      p_google_email,
      p_twitter_id,
      p_twitter_username,
      v_auth_provider
    ) RETURNING * INTO v_user;
  END IF;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
