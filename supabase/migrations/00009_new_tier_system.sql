-- Migration: New 10-tier credibility system
-- Replaces UNVERIFIED/BRONZE/SILVER/GOLD/PLATINUM with new 10-tier system

-- First, drop the trigger that uses the calculate_tier function
DROP TRIGGER IF EXISTS update_tier_on_credibility_change ON users;

-- Drop the function that depends on the old enum type
DROP FUNCTION IF EXISTS update_user_tier();
DROP FUNCTION IF EXISTS calculate_tier(numeric);
DROP FUNCTION IF EXISTS calculate_tier(decimal);

-- Create new tier enum
CREATE TYPE credibility_tier_new AS ENUM (
  'UNTRUSTED',
  'QUESTIONABLE',
  'NEUTRAL',
  'KNOWN',
  'ESTABLISHED',
  'REPUTABLE',
  'EXEMPLARY',
  'DISTINGUISHED',
  'REVERED',
  'RENOWNED'
);

-- Add temporary column with new type
ALTER TABLE users ADD COLUMN tier_new credibility_tier_new;

-- Migrate existing tier values to new system
-- Map old tiers to closest new tiers based on credibility ranges
UPDATE users SET tier_new = CASE
  WHEN tier = 'PLATINUM' THEN 'EXEMPLARY'::credibility_tier_new  -- 2000+ -> EXEMPLARY (2000-2199)
  WHEN tier = 'GOLD' THEN 'REPUTABLE'::credibility_tier_new      -- 1500-1999 -> REPUTABLE (1800-1999)
  WHEN tier = 'SILVER' THEN 'ESTABLISHED'::credibility_tier_new  -- 1000-1499 -> ESTABLISHED (1600-1799)
  WHEN tier = 'BRONZE' THEN 'NEUTRAL'::credibility_tier_new      -- 500-999 -> NEUTRAL (1200-1399)
  ELSE 'UNTRUSTED'::credibility_tier_new                         -- 0-499 -> UNTRUSTED (0-799)
END;

-- For more accurate migration, use actual credibility values if available
UPDATE users SET tier_new = CASE
  WHEN ethos_credibility >= 2600 THEN 'RENOWNED'::credibility_tier_new
  WHEN ethos_credibility >= 2400 THEN 'REVERED'::credibility_tier_new
  WHEN ethos_credibility >= 2200 THEN 'DISTINGUISHED'::credibility_tier_new
  WHEN ethos_credibility >= 2000 THEN 'EXEMPLARY'::credibility_tier_new
  WHEN ethos_credibility >= 1800 THEN 'REPUTABLE'::credibility_tier_new
  WHEN ethos_credibility >= 1600 THEN 'ESTABLISHED'::credibility_tier_new
  WHEN ethos_credibility >= 1400 THEN 'KNOWN'::credibility_tier_new
  WHEN ethos_credibility >= 1200 THEN 'NEUTRAL'::credibility_tier_new
  WHEN ethos_credibility >= 800 THEN 'QUESTIONABLE'::credibility_tier_new
  ELSE 'UNTRUSTED'::credibility_tier_new
END
WHERE ethos_credibility IS NOT NULL;

-- Drop the old tier column and rename new one
ALTER TABLE users DROP COLUMN tier;
ALTER TABLE users RENAME COLUMN tier_new TO tier;

-- Now drop old enum type (no dependencies remaining)
DROP TYPE credibility_tier;

-- Rename new enum to standard name
ALTER TYPE credibility_tier_new RENAME TO credibility_tier;

-- Recreate the calculate_tier function with the new enum
CREATE OR REPLACE FUNCTION calculate_tier(credibility DECIMAL)
RETURNS credibility_tier AS $$
BEGIN
  RETURN CASE
    WHEN credibility >= 2600 THEN 'RENOWNED'::credibility_tier
    WHEN credibility >= 2400 THEN 'REVERED'::credibility_tier
    WHEN credibility >= 2200 THEN 'DISTINGUISHED'::credibility_tier
    WHEN credibility >= 2000 THEN 'EXEMPLARY'::credibility_tier
    WHEN credibility >= 1800 THEN 'REPUTABLE'::credibility_tier
    WHEN credibility >= 1600 THEN 'ESTABLISHED'::credibility_tier
    WHEN credibility >= 1400 THEN 'KNOWN'::credibility_tier
    WHEN credibility >= 1200 THEN 'NEUTRAL'::credibility_tier
    WHEN credibility >= 800 THEN 'QUESTIONABLE'::credibility_tier
    ELSE 'UNTRUSTED'::credibility_tier
  END;
END;
$$ LANGUAGE plpgsql;

-- Recreate the update_user_tier function
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier = calculate_tier(NEW.ethos_credibility);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_tier_on_credibility_change
  BEFORE INSERT OR UPDATE OF ethos_credibility ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier();
