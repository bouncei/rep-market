-- RepMarket Initial Schema Migration
-- Phase 1: Foundation Setup

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE market_status AS ENUM (
  'DRAFT',
  'OPEN',
  'LOCKED',
  'RESOLVED',
  'SETTLED',
  'CANCELLED'
);

CREATE TYPE oracle_type AS ENUM (
  'price_close',
  'metric_threshold',
  'count_threshold'
);

CREATE TYPE prediction_position AS ENUM (
  'YES',
  'NO'
);

CREATE TYPE resolution_outcome AS ENUM (
  'YES',
  'NO',
  'INVALID'
);

CREATE TYPE credibility_tier AS ENUM (
  'UNVERIFIED',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,

  -- Ethos data
  ethos_profile_id INTEGER,
  ethos_score INTEGER DEFAULT 0,
  ethos_credibility DECIMAL(10, 4) DEFAULT 0,
  ethos_last_synced_at TIMESTAMPTZ,

  -- RepScore (platform reputation)
  rep_score DECIMAL(10, 2) DEFAULT 0,
  tier credibility_tier DEFAULT 'UNVERIFIED',

  -- Stats
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5, 4) DEFAULT 0,
  total_staked DECIMAL(20, 4) DEFAULT 0,
  total_won DECIMAL(20, 4) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_ethos_profile_id ON users(ethos_profile_id);
CREATE INDEX idx_users_rep_score ON users(rep_score DESC);
CREATE INDEX idx_users_tier ON users(tier);

-- ============================================
-- MARKETS TABLE
-- ============================================

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'crypto',

  -- Status
  status market_status DEFAULT 'DRAFT',

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opens_at TIMESTAMPTZ,
  locks_at TIMESTAMPTZ NOT NULL,
  resolves_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,

  -- Oracle configuration
  oracle_type oracle_type NOT NULL,
  oracle_config JSONB NOT NULL DEFAULT '{}',
  -- oracle_config structure examples:
  -- price_close: { "asset": "BTC", "threshold": 150000, "comparison": "above", "sources": ["coingecko", "coinbase"] }
  -- metric_threshold: { "protocol": "eigenlayer", "metric": "tvl", "threshold": 30000000000, "comparison": "gte" }
  -- count_threshold: { "entity": "ethos_profiles", "threshold": 100000, "comparison": "gte" }

  -- Probabilities
  raw_probability_yes DECIMAL(5, 4) DEFAULT 0.5,
  weighted_probability_yes DECIMAL(5, 4) DEFAULT 0.5,

  -- Stakes
  total_stake_yes DECIMAL(20, 4) DEFAULT 0,
  total_stake_no DECIMAL(20, 4) DEFAULT 0,
  total_weighted_stake_yes DECIMAL(20, 4) DEFAULT 0,
  total_weighted_stake_no DECIMAL(20, 4) DEFAULT 0,

  -- Resolution
  resolution_outcome resolution_outcome,
  resolution_value TEXT,
  resolution_evidence_id UUID,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_locks_at ON markets(locks_at);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_oracle_type ON markets(oracle_type);

-- ============================================
-- PREDICTIONS TABLE
-- ============================================

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Prediction details
  position prediction_position NOT NULL,
  stake_amount DECIMAL(20, 4) NOT NULL CHECK (stake_amount > 0),

  -- Credibility weighting at time of prediction
  credibility_at_prediction DECIMAL(10, 4) NOT NULL DEFAULT 0,
  weighted_stake DECIMAL(20, 4) NOT NULL DEFAULT 0,

  -- Settlement
  is_settled BOOLEAN DEFAULT FALSE,
  payout_amount DECIMAL(20, 4),
  rep_score_delta DECIMAL(10, 2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_market_id ON predictions(market_id);
CREATE INDEX idx_predictions_position ON predictions(position);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
CREATE UNIQUE INDEX idx_predictions_user_market ON predictions(user_id, market_id);

-- ============================================
-- SETTLEMENTS TABLE
-- ============================================

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Settlement details
  outcome resolution_outcome NOT NULL,
  total_pool DECIMAL(20, 4) NOT NULL,
  winners_pool DECIMAL(20, 4) NOT NULL,
  losers_pool DECIMAL(20, 4) NOT NULL,

  -- Counts
  total_predictions INTEGER NOT NULL,
  winning_predictions INTEGER NOT NULL,

  -- Audit data
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  evidence_log_id UUID,
  settlement_hash TEXT,

  UNIQUE(market_id)
);

CREATE INDEX idx_settlements_market_id ON settlements(market_id);
CREATE INDEX idx_settlements_processed_at ON settlements(processed_at DESC);

-- ============================================
-- EVIDENCE LOGS TABLE
-- ============================================

CREATE TABLE evidence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Oracle response data
  oracle_type oracle_type NOT NULL,
  sources_queried JSONB NOT NULL DEFAULT '[]',
  -- sources_queried: [{ "source": "coingecko", "url": "...", "response_hash": "...", "value": 151234.56 }]

  extracted_value TEXT NOT NULL,
  decision resolution_outcome NOT NULL,

  -- Evidence hash for immutability verification
  evidence_hash TEXT NOT NULL,

  -- Timestamps
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_logs_market_id ON evidence_logs(market_id);
CREATE INDEX idx_evidence_logs_fetched_at ON evidence_logs(fetched_at DESC);

-- ============================================
-- CREDIBILITY SYNC LOGS TABLE
-- ============================================

CREATE TABLE credibility_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Sync data
  previous_ethos_score INTEGER,
  new_ethos_score INTEGER,
  previous_credibility DECIMAL(10, 4),
  new_credibility DECIMAL(10, 4),

  -- Source info
  sync_source TEXT DEFAULT 'background_job',
  ethos_response_hash TEXT,

  -- Timestamp
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credibility_sync_logs_user_id ON credibility_sync_logs(user_id);
CREATE INDEX idx_credibility_sync_logs_synced_at ON credibility_sync_logs(synced_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credibility_sync_logs ENABLE ROW LEVEL SECURITY;

-- Users: Public read, self-update, self-insert
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Markets: Public read
CREATE POLICY "Markets are viewable by everyone"
  ON markets FOR SELECT
  USING (true);

-- Predictions: Public read, owner insert
CREATE POLICY "Predictions are viewable by everyone"
  ON predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can create predictions"
  ON predictions FOR INSERT
  WITH CHECK (true);

-- Settlements: Public read (transparency)
CREATE POLICY "Settlements are viewable by everyone"
  ON settlements FOR SELECT
  USING (true);

-- Evidence logs: Public read (transparency)
CREATE POLICY "Evidence logs are viewable by everyone"
  ON evidence_logs FOR SELECT
  USING (true);

-- Credibility sync logs: Owner read only
CREATE POLICY "Users can view their own sync logs"
  ON credibility_sync_logs FOR SELECT
  USING (user_id IN (
    SELECT id FROM users
    WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  ));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate tier from ethos credibility
CREATE OR REPLACE FUNCTION calculate_tier(credibility DECIMAL)
RETURNS credibility_tier AS $$
BEGIN
  RETURN CASE
    WHEN credibility >= 2000 THEN 'PLATINUM'::credibility_tier
    WHEN credibility >= 1500 THEN 'GOLD'::credibility_tier
    WHEN credibility >= 1000 THEN 'SILVER'::credibility_tier
    WHEN credibility >= 500 THEN 'BRONZE'::credibility_tier
    ELSE 'UNVERIFIED'::credibility_tier
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update tier when ethos_credibility changes
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier = calculate_tier(NEW.ethos_credibility);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tier_on_credibility_change
  BEFORE INSERT OR UPDATE OF ethos_credibility ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier();

-- Function to recalculate market probabilities
CREATE OR REPLACE FUNCTION recalculate_market_probabilities(market_uuid UUID)
RETURNS void AS $$
DECLARE
  total_yes DECIMAL(20, 4);
  total_no DECIMAL(20, 4);
  weighted_yes DECIMAL(20, 4);
  weighted_no DECIMAL(20, 4);
BEGIN
  -- Get totals
  SELECT
    COALESCE(SUM(CASE WHEN position = 'YES' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'YES' THEN weighted_stake ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN position = 'NO' THEN weighted_stake ELSE 0 END), 0)
  INTO total_yes, total_no, weighted_yes, weighted_no
  FROM predictions
  WHERE market_id = market_uuid;

  -- Update market
  UPDATE markets
  SET
    total_stake_yes = total_yes,
    total_stake_no = total_no,
    total_weighted_stake_yes = weighted_yes,
    total_weighted_stake_no = weighted_no,
    raw_probability_yes = CASE
      WHEN total_yes + total_no > 0 THEN total_yes / (total_yes + total_no)
      ELSE 0.5
    END,
    weighted_probability_yes = CASE
      WHEN weighted_yes + weighted_no > 0 THEN weighted_yes / (weighted_yes + weighted_no)
      ELSE 0.5
    END
  WHERE id = market_uuid;
END;
$$ LANGUAGE plpgsql;
