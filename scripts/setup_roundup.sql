-- RoundUp Database Schema Setup
-- This script creates all necessary tables for the RoundUp app

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  total_saved DECIMAL(10, 2) DEFAULT 0,
  xp_points INT DEFAULT 0,
  level INT DEFAULT 1,
  spending_personality TEXT DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP DEFAULT NOW(),
  source TEXT DEFAULT 'manual',
  roundup_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can read their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Achievements/Badges Table
CREATE TABLE IF NOT EXISTS achievements_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_name)
);

-- Create index for badges
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON achievements_badges(user_id);

-- Enable RLS on achievements_badges
ALTER TABLE achievements_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements_badges
CREATE POLICY "Users can read their own badges"
  ON achievements_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON achievements_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Weekly Challenges Table
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  challenge_name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2),
  current_amount DECIMAL(10, 2) DEFAULT 0,
  xp_reward INT DEFAULT 100,
  is_completed BOOLEAN DEFAULT FALSE,
  week_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, week_start, challenge_name)
);

-- Create index for weekly challenges
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user_id ON weekly_challenges(user_id);

-- Enable RLS on weekly_challenges
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_challenges
CREATE POLICY "Users can read their own challenges"
  ON weekly_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
  ON weekly_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON weekly_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Monthly Challenges Table
CREATE TABLE IF NOT EXISTS monthly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  challenge_name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2),
  current_amount DECIMAL(10, 2) DEFAULT 0,
  xp_reward INT DEFAULT 500,
  is_completed BOOLEAN DEFAULT FALSE,
  month_year TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year, challenge_name)
);

-- Create index for monthly challenges
CREATE INDEX IF NOT EXISTS idx_monthly_challenges_user_id ON monthly_challenges(user_id);

-- Enable RLS on monthly_challenges
ALTER TABLE monthly_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_challenges
CREATE POLICY "Users can read their own monthly challenges"
  ON monthly_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly challenges"
  ON monthly_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly challenges"
  ON monthly_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Monthly Stats Table
CREATE TABLE IF NOT EXISTS monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_saved DECIMAL(10, 2) DEFAULT 0,
  total_roundup DECIMAL(10, 2) DEFAULT 0,
  avg_transaction DECIMAL(10, 2) DEFAULT 0,
  transaction_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Create index for monthly stats
CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);

-- Enable RLS on monthly_stats
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_stats
CREATE POLICY "Users can read their own monthly stats"
  ON monthly_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly stats"
  ON monthly_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly stats"
  ON monthly_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Investment Options Table (public, no RLS needed)
CREATE TABLE IF NOT EXISTS investment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  expected_return_rate DECIMAL(5, 2),
  risk_level TEXT,
  min_investment DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. User Investment Preferences Table
CREATE TABLE IF NOT EXISTS user_investment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investment_options(id),
  monthly_sip DECIMAL(10, 2) DEFAULT 0,
  total_invested DECIMAL(10, 2) DEFAULT 0,
  projected_1yr DECIMAL(10, 2) DEFAULT 0,
  projected_3yr DECIMAL(10, 2) DEFAULT 0,
  projected_5yr DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, investment_id)
);

-- Create index for user investments
CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investment_preferences(user_id);

-- Enable RLS on user_investment_preferences
ALTER TABLE user_investment_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_investment_preferences
CREATE POLICY "Users can read their own investment preferences"
  ON user_investment_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment preferences"
  ON user_investment_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment preferences"
  ON user_investment_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. Default Investment Options
INSERT INTO investment_options (name, description, expected_return_rate, risk_level, min_investment)
VALUES
  ('Digital Gold', 'Invest in digital gold with daily liquidity', 5.5, 'Low', 100),
  ('Index Funds (Nifty 50)', 'Diversified equity exposure to top 50 companies', 12.0, 'Medium', 500),
  ('Fixed Deposit (1 Year)', 'Guaranteed returns from bank FDs', 6.5, 'Very Low', 1000),
  ('SIP - Balanced Fund', 'Balanced mix of equity and debt for long-term growth', 9.0, 'Medium', 100),
  ('Corporate Bonds', 'High-yield corporate bonds with fixed returns', 7.5, 'Medium-High', 5000)
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();
