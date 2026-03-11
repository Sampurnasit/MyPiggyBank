-- RoundUp Database Schema - Part 1: Tables
-- All tables have RLS enabled and secure policies

-- 1. USER PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  piggy_bank_balance DECIMAL(15,2) DEFAULT 0,
  spendable_balance DECIMAL(15,2) DEFAULT 0,
  roundup_aggressiveness TEXT DEFAULT 'moderate' CHECK (roundup_aggressiveness IN ('conservative', 'moderate', 'aggressive')),
  current_level INT DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 6),
  current_xp INT DEFAULT 0,
  spending_personality_type TEXT DEFAULT NULL,
  risk_profile_type TEXT DEFAULT NULL,
  phone_number TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. TRANSACTIONS (manual and SMS parsed)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  roundup_amount DECIMAL(15,2) DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'shopping', 'entertainment', 'utilities', 'health', 'education', 'subscription', 'other')),
  merchant TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  transaction_date TIMESTAMP NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'sms_parsed', 'gmail_parsed')),
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. ACHIEVEMENTS & BADGES
CREATE TABLE IF NOT EXISTS achievements_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT now(),
  unlock_progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE achievements_badges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_badges_user_id ON achievements_badges(user_id);

CREATE POLICY "Users can view own badges" ON achievements_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON achievements_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. WEEKLY CHALLENGES
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  target_amount DECIMAL(15,2) DEFAULT 0,
  current_amount DECIMAL(15,2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  week_start_date DATE NOT NULL,
  bonus_xp INT DEFAULT 50,
  completed_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, week_start_date, challenge_type)
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_weekly_challenges_user_id ON weekly_challenges(user_id);

CREATE POLICY "Users can view own challenges" ON weekly_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON weekly_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON weekly_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. MONTHLY CHALLENGES
CREATE TABLE IF NOT EXISTS monthly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  target_amount DECIMAL(15,2) DEFAULT 0,
  current_amount DECIMAL(15,2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  month DATE NOT NULL,
  bonus_xp INT DEFAULT 100,
  completed_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, month, challenge_type)
);

ALTER TABLE monthly_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_monthly_challenges_user_id ON monthly_challenges(user_id);

CREATE POLICY "Users can view own challenges" ON monthly_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges" ON monthly_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON monthly_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. DAILY SPENDING LOG (for streak tracking)
CREATE TABLE IF NOT EXISTS spending_log_daily (
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  total_spent DECIMAL(15,2) DEFAULT 0,
  transaction_count INT DEFAULT 0,
  streak_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);

ALTER TABLE spending_log_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON spending_log_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON spending_log_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON spending_log_daily
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. MONTHLY STATS (snapshot for historical analysis)
CREATE TABLE IF NOT EXISTS monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_saved DECIMAL(15,2) DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  transaction_count INT DEFAULT 0,
  personality_type TEXT DEFAULT NULL,
  top_category TEXT DEFAULT NULL,
  category_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_monthly_stats_user_id ON monthly_stats(user_id);

CREATE POLICY "Users can view own stats" ON monthly_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON monthly_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. INVESTMENT CHOICES (reference table, public read)
CREATE TABLE IF NOT EXISTS investment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  expected_annual_return DECIMAL(5,2) NOT NULL,
  icon_type TEXT DEFAULT 'digital-gold',
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE investment_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investment options" ON investment_options
  FOR SELECT USING (true);

-- 9. USER INVESTMENT PREFERENCES
CREATE TABLE IF NOT EXISTS user_investment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  risk_profile TEXT NOT NULL,
  preferred_investments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_investment_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_investment_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_investment_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_investment_preferences
  FOR UPDATE USING (auth.uid() = user_id);
