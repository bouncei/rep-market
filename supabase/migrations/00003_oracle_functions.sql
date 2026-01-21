-- Migration: Add oracle-related database functions and pg_cron setup
-- This migration adds:
-- 1. Function to update user stats after settlement
-- 2. pg_cron extension and scheduled job for oracle engine

-- 1. Create function to update user stats after prediction settlement
CREATE OR REPLACE FUNCTION update_user_stats_after_settlement(
  p_user_id UUID,
  p_rep_delta INTEGER,
  p_won BOOLEAN,
  p_payout NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    rep_score = COALESCE(rep_score, 500) + p_rep_delta,
    total_won = COALESCE(total_won, 0) + CASE WHEN p_won THEN p_payout ELSE 0 END,
    correct_predictions = COALESCE(correct_predictions, 0) + CASE WHEN p_won THEN 1 ELSE 0 END,
    accuracy_rate = CASE
      WHEN COALESCE(total_predictions, 0) > 0
      THEN (COALESCE(correct_predictions, 0) + CASE WHEN p_won THEN 1 ELSE 0 END)::NUMERIC / total_predictions
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable pg_cron extension (requires superuser or database owner)
-- Note: This may need to be enabled via Supabase dashboard if not already enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Create a helper function to invoke the edge function via pg_net
-- This function will be called by pg_cron
CREATE OR REPLACE FUNCTION invoke_oracle_engine()
RETURNS VOID AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the Supabase URL from environment or hardcode for now
  -- In production, you'd use vault secrets
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings aren't configured, skip
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE NOTICE 'Oracle engine settings not configured';
    RETURN;
  END IF;

  -- Use pg_net to call the edge function (if pg_net is available)
  -- PERFORM net.http_post(
  --   url := supabase_url || '/functions/v1/oracle-run',
  --   headers := jsonb_build_object(
  --     'Authorization', 'Bearer ' || service_role_key,
  --     'Content-Type', 'application/json'
  --   ),
  --   body := '{}'::jsonb
  -- );

  RAISE NOTICE 'Oracle engine invocation placeholder - configure pg_net for actual HTTP calls';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION update_user_stats_after_settlement TO service_role;
GRANT EXECUTE ON FUNCTION invoke_oracle_engine TO service_role;

-- 5. Add comment for documentation
COMMENT ON FUNCTION update_user_stats_after_settlement IS 'Updates user statistics after a prediction is settled. Called by the oracle engine edge function.';
COMMENT ON FUNCTION invoke_oracle_engine IS 'Helper function to invoke the oracle-run edge function. Can be scheduled via pg_cron.';

-- Note: To set up pg_cron scheduling, run this in the Supabase SQL editor after enabling pg_cron:
-- SELECT cron.schedule(
--   'oracle-engine-job',
--   '*/2 * * * *',  -- Every 2 minutes
--   $$SELECT invoke_oracle_engine()$$
-- );
