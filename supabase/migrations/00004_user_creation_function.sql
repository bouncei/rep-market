-- Migration: Add secure user creation function
-- This function uses SECURITY DEFINER to bypass RLS for user creation

CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  p_wallet_address TEXT DEFAULT NULL,
  p_twitter_id TEXT DEFAULT NULL,
  p_twitter_username TEXT DEFAULT NULL,
  p_google_id TEXT DEFAULT NULL,
  p_google_email TEXT DEFAULT NULL,
  p_auth_provider TEXT DEFAULT 'wallet'
)
RETURNS TABLE (
  id UUID,
  wallet_address TEXT,
  twitter_id TEXT,
  twitter_username TEXT,
  google_id TEXT,
  google_email TEXT,
  ethos_profile_id INTEGER,
  ethos_score INTEGER,
  ethos_credibility DECIMAL,
  rep_score DECIMAL,
  tier credibility_tier,
  is_new BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Try to find existing user
  SELECT u.id INTO v_user_id
  FROM users u
  WHERE
    (p_wallet_address IS NOT NULL AND u.wallet_address = p_wallet_address) OR
    (p_twitter_id IS NOT NULL AND u.twitter_id = p_twitter_id) OR
    (p_google_id IS NOT NULL AND u.google_id = p_google_id)
  LIMIT 1;

  -- If user doesn't exist, create one
  IF v_user_id IS NULL THEN
    INSERT INTO users (
      wallet_address,
      twitter_id,
      twitter_username,
      google_id,
      google_email,
      auth_provider,
      created_at,
      updated_at
    ) VALUES (
      p_wallet_address,
      p_twitter_id,
      p_twitter_username,
      p_google_id,
      p_google_email,
      p_auth_provider,
      NOW(),
      NOW()
    )
    RETURNING users.id INTO v_user_id;

    v_is_new := TRUE;
  END IF;

  -- Return the user data
  RETURN QUERY
  SELECT
    u.id,
    u.wallet_address,
    u.twitter_id,
    u.twitter_username,
    u.google_id,
    u.google_email,
    u.ethos_profile_id,
    u.ethos_score,
    u.ethos_credibility,
    u.rep_score,
    u.tier,
    v_is_new as is_new
  FROM users u
  WHERE u.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO anon;
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO authenticated;

COMMENT ON FUNCTION create_user_if_not_exists IS 'Creates a user if they do not exist, bypassing RLS. Returns user data and whether the user was newly created.';
