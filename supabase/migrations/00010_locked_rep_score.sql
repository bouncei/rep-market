-- Migration: Add locked RepScore tracking
-- RepScore should be "locked" (not available) when a prediction is placed,
-- and released when the prediction is settled

-- Add locked_rep_score column to users table
ALTER TABLE users
ADD COLUMN locked_rep_score DECIMAL(10, 2) DEFAULT 0;

-- Set all existing users to have 0 locked (clean slate)
UPDATE users SET locked_rep_score = 0;

-- Add constraint to ensure rep_score is never negative
-- (User can't stake more than they have)
ALTER TABLE users
ADD CONSTRAINT check_rep_score_non_negative
  CHECK (rep_score >= 0);

-- Add constraint to ensure locked_rep_score is never negative
ALTER TABLE users
ADD CONSTRAINT check_locked_rep_score_non_negative
  CHECK (locked_rep_score >= 0);

-- Calculate locked_rep_score from existing unsettled predictions
-- for existing users who have active predictions
UPDATE users u
SET locked_rep_score = COALESCE(
  (SELECT SUM(stake_amount)
   FROM predictions p
   WHERE p.user_id = u.id
   AND p.is_settled = false),
  0
);
