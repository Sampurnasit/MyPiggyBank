-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This adds the missing columns if they don't exist

-- Add spendable_balance if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='spendable_balance') THEN
    ALTER TABLE user_profiles ADD COLUMN spendable_balance DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

-- Add piggy_bank_balance if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='piggy_bank_balance') THEN
    ALTER TABLE user_profiles ADD COLUMN piggy_bank_balance DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

-- Add total_saved if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_saved') THEN
    ALTER TABLE user_profiles ADD COLUMN total_saved DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

-- Add username if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='username') THEN
    ALTER TABLE user_profiles ADD COLUMN username TEXT DEFAULT 'User';
  END IF;
END $$;

-- Add full_name if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='full_name') THEN
    ALTER TABLE user_profiles ADD COLUMN full_name TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add xp_points if missing (alias for current_xp)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='xp_points') THEN
    ALTER TABLE user_profiles ADD COLUMN xp_points INT DEFAULT 0;
  END IF;
END $$;

-- Add level if missing (alias for current_level)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='level') THEN
    ALTER TABLE user_profiles ADD COLUMN level INT DEFAULT 1;
  END IF;
END $$;

-- Add spending_personality if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='spending_personality') THEN
    ALTER TABLE user_profiles ADD COLUMN spending_personality TEXT DEFAULT 'unknown';
  END IF;
END $$;

-- Ensure RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe if they already exist)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
