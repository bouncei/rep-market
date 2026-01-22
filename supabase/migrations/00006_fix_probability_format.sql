-- Migration: Fix probability format from percentages (0-100) to decimals (0-1)
-- This fixes Bug 2 where API was storing percentages but frontend expects decimals

-- Fix existing markets with percentage values (any value > 1 is a percentage)
UPDATE markets
SET raw_probability_yes = raw_probability_yes / 100
WHERE raw_probability_yes > 1;

UPDATE markets
SET weighted_probability_yes = weighted_probability_yes / 100
WHERE weighted_probability_yes > 1;

-- Add constraint to ensure probabilities are always in decimal format (0-1)
ALTER TABLE markets
ADD CONSTRAINT check_raw_probability_range
  CHECK (raw_probability_yes >= 0 AND raw_probability_yes <= 1);

ALTER TABLE markets
ADD CONSTRAINT check_weighted_probability_range
  CHECK (weighted_probability_yes >= 0 AND weighted_probability_yes <= 1);
