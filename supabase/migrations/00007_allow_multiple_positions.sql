-- Migration: Allow multiple positions per user per market
-- Drop the unique constraint that prevents users from placing multiple predictions

-- Drop the unique index
DROP INDEX IF EXISTS idx_predictions_user_market;

-- Create a regular (non-unique) index for query performance
-- This allows multiple predictions per user-market combination while keeping queries fast
CREATE INDEX idx_predictions_user_market_lookup ON predictions(user_id, market_id);
