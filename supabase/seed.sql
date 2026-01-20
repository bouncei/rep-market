-- RepMarket Seed Data
-- Demo Markets for Phase 1

INSERT INTO markets (
  title,
  description,
  category,
  status,
  opens_at,
  locks_at,
  oracle_type,
  oracle_config,
  raw_probability_yes,
  weighted_probability_yes,
  total_stake_yes,
  total_stake_no,
  total_weighted_stake_yes,
  total_weighted_stake_no
) VALUES
-- Market 1: BTC Daily Close
(
  'Will BTC close above $150,000 on Feb 28, 2026?',
  'Bitcoin must close at or above $150,000 USD at midnight UTC on February 28, 2026 according to CoinGecko and Coinbase price feeds.',
  'crypto',
  'OPEN',
  NOW(),
  '2026-02-28T00:00:00Z',
  'price_close',
  '{"asset": "BTC", "threshold": 150000, "comparison": "above", "sources": ["coingecko", "coinbase"]}',
  0.62,
  0.71,
  3100,
  1900,
  2200,
  900
),
-- Market 2: ETH Daily Close
(
  'Will ETH close above $8,000 on Mar 31, 2026?',
  'Ethereum must close at or above $8,000 USD at midnight UTC on March 31, 2026 according to CoinGecko and Coinbase price feeds.',
  'crypto',
  'OPEN',
  NOW(),
  '2026-03-31T00:00:00Z',
  'price_close',
  '{"asset": "ETH", "threshold": 8000, "comparison": "above", "sources": ["coingecko", "coinbase"]}',
  0.55,
  0.63,
  2750,
  2250,
  1850,
  1150
),
-- Market 3: EigenLayer TVL
(
  'Will EigenLayer TVL exceed $30B by Apr 1, 2026?',
  'EigenLayer total value locked must be at or above $30 billion USD on April 1, 2026 according to DeFiLlama.',
  'defi',
  'OPEN',
  NOW(),
  '2026-04-01T00:00:00Z',
  'metric_threshold',
  '{"protocol": "eigenlayer", "metric": "tvl", "threshold": 30000000000, "comparison": "gte"}',
  0.48,
  0.58,
  2400,
  2600,
  1750,
  1250
),
-- Market 4: Base TVL
(
  'Will Base TVL exceed $20B by Mar 15, 2026?',
  'Base Layer 2 total value locked must be at or above $20 billion USD on March 15, 2026 according to DeFiLlama.',
  'defi',
  'OPEN',
  NOW(),
  '2026-03-15T00:00:00Z',
  'metric_threshold',
  '{"protocol": "base", "metric": "tvl", "threshold": 20000000000, "comparison": "gte"}',
  0.52,
  0.47,
  2600,
  2400,
  1400,
  1600
),
-- Market 5: Ethos Growth
(
  'Will Ethos verified profiles exceed 100,000 by Apr 30, 2026?',
  'Ethos Network must have at least 100,000 verified profiles by April 30, 2026 according to the Ethos API.',
  'social',
  'OPEN',
  NOW(),
  '2026-04-30T00:00:00Z',
  'count_threshold',
  '{"entity": "ethos_profiles", "threshold": 100000, "comparison": "gte"}',
  0.65,
  0.78,
  3250,
  1750,
  2600,
  700
);
