-- Migration: Increase virtual liquidity to significantly reduce slippage
-- This fixes the critical bug where users were losing >50% on small round-trip trades
-- Virtual liquidity increased from 100 to 1000 per side (10x improvement)

-- Update default values for new markets
ALTER TABLE markets
ALTER COLUMN virtual_stake_yes SET DEFAULT 1000,
ALTER COLUMN virtual_stake_no SET DEFAULT 1000;

-- Update existing markets to have higher virtual liquidity
UPDATE markets
SET 
  virtual_stake_yes = 1000,
  virtual_stake_no = 1000
WHERE 
  virtual_stake_yes < 1000 OR 
  virtual_stake_no < 1000 OR
  virtual_stake_yes IS NULL OR
  virtual_stake_no IS NULL;

-- Update the recalculate_market_probabilities function to use new defaults
CREATE OR REPLACE FUNCTION recalculate_market_probabilities(market_uuid UUID)
RETURNS void AS $$
DECLARE
  total_yes DECIMAL(20, 4);
  total_no DECIMAL(20, 4);
  weighted_yes DECIMAL(20, 4);
  weighted_no DECIMAL(20, 4);
  v_stake_yes DECIMAL(20, 4);
  v_stake_no DECIMAL(20, 4);
  effective_yes DECIMAL(20, 4);
  effective_no DECIMAL(20, 4);
  effective_weighted_yes DECIMAL(20, 4);
  effective_weighted_no DECIMAL(20, 4);
BEGIN
  -- Get virtual stakes for the market
  SELECT virtual_stake_yes, virtual_stake_no
  INTO v_stake_yes, v_stake_no
  FROM markets
  WHERE id = market_uuid;

  -- Default to 1000 if null (increased from 100)
  v_stake_yes := COALESCE(v_stake_yes, 1000);
  v_stake_no := COALESCE(v_stake_no, 1000);

  -- Get totals from predictions
  SELECT
    COALESCE(SUM(CASE WHEN position = 'YES' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'YES' THEN weighted_stake ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN weighted_stake ELSE 0 END), 0)
  INTO total_yes, total_no, weighted_yes, weighted_no
  FROM predictions
  WHERE market_id = market_uuid
    AND is_settled = FALSE; -- Only count active positions

  -- Calculate effective totals including virtual liquidity
  effective_yes := total_yes + v_stake_yes;
  effective_no := total_no + v_stake_no;
  effective_weighted_yes := weighted_yes + v_stake_yes;
  effective_weighted_no := weighted_no + v_stake_no;

  -- Update market
  UPDATE markets
  SET
    total_stake_yes = total_yes,
    total_stake_no = total_no,
    total_weighted_stake_yes = weighted_yes,
    total_weighted_stake_no = weighted_no,
    raw_probability_yes = CASE
      WHEN effective_yes + effective_no > 0 THEN effective_yes / (effective_yes + effective_no)
      ELSE 0.5
    END,
    weighted_probability_yes = CASE
      WHEN effective_weighted_yes + effective_weighted_no > 0
      THEN effective_weighted_yes / (effective_weighted_yes + effective_weighted_no)
      ELSE 0.5
    END
  WHERE id = market_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON COLUMN markets.virtual_stake_yes IS 'Virtual liquidity for YES side (default 1000). Provides depth to reduce slippage on small trades.';
COMMENT ON COLUMN markets.virtual_stake_no IS 'Virtual liquidity for NO side (default 1000). Provides depth to reduce slippage on small trades.';
