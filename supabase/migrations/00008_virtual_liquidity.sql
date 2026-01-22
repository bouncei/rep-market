-- Migration: Add virtual liquidity to dampen early volatility
-- This prevents first predictions from immediately swinging to extreme odds

-- Add virtual stake columns to markets table
ALTER TABLE markets
ADD COLUMN virtual_stake_yes DECIMAL(20, 4) DEFAULT 100,
ADD COLUMN virtual_stake_no DECIMAL(20, 4) DEFAULT 100;

-- Set virtual stakes for existing markets
UPDATE markets
SET virtual_stake_yes = 100, virtual_stake_no = 100;

-- Update the recalculate_market_probabilities function to include virtual liquidity
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

  -- Default to 100 if null
  v_stake_yes := COALESCE(v_stake_yes, 100);
  v_stake_no := COALESCE(v_stake_no, 100);

  -- Get totals from predictions
  SELECT
    COALESCE(SUM(CASE WHEN position = 'YES' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'YES' THEN weighted_stake ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN weighted_stake ELSE 0 END), 0)
  INTO total_yes, total_no, weighted_yes, weighted_no
  FROM predictions
  WHERE market_id = market_uuid;

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
