-- 007_onboarding.sql
-- Add has_onboarded column to track if a user has dismissed the onboarding card.
-- Backfill existing users to true so they don't see the onboarding card on first login.

ALTER TABLE users ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;

-- Backfill: existing users should NOT see onboarding card (new users only)
UPDATE users SET has_onboarded = true;
