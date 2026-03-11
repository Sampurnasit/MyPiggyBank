import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const setupDatabase = async () => {
  try {
    console.log('[v0] Starting RoundUp database setup...');

    // Create user_profiles table
    const { error: userProfilesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (userProfilesError) {
      console.error('[v0] Error creating user_profiles table:', userProfilesError);
    } else {
      console.log('[v0] ✓ user_profiles table created');
    }

    // Create transactions table
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      `
    });

    if (transactionsError) {
      console.error('[v0] Error creating transactions table:', transactionsError);
    } else {
      console.log('[v0] ✓ transactions table created');
    }

    // Create achievements_badges table
    const { error: badgesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS achievements_badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          badge_name TEXT NOT NULL,
          description TEXT,
          icon_emoji TEXT,
          earned_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, badge_name)
        );
        CREATE INDEX IF NOT EXISTS idx_badges_user_id ON achievements_badges(user_id);
      `
    });

    if (badgesError) {
      console.error('[v0] Error creating achievements_badges table:', badgesError);
    } else {
      console.log('[v0] ✓ achievements_badges table created');
    }

    // Create weekly_challenges table
    const { error: weeklyChallengesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user_id ON weekly_challenges(user_id);
      `
    });

    if (weeklyChallengesError) {
      console.error('[v0] Error creating weekly_challenges table:', weeklyChallengesError);
    } else {
      console.log('[v0] ✓ weekly_challenges table created');
    }

    // Create monthly_challenges table
    const { error: monthlyChallengesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_monthly_challenges_user_id ON monthly_challenges(user_id);
      `
    });

    if (monthlyChallengesError) {
      console.error('[v0] Error creating monthly_challenges table:', monthlyChallengesError);
    } else {
      console.log('[v0] ✓ monthly_challenges table created');
    }

    // Create monthly_stats table
    const { error: monthlyStatsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);
      `
    });

    if (monthlyStatsError) {
      console.error('[v0] Error creating monthly_stats table:', monthlyStatsError);
    } else {
      console.log('[v0] ✓ monthly_stats table created');
    }

    // Create investment_options table
    const { error: investmentError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS investment_options (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          expected_return_rate DECIMAL(5, 2),
          risk_level TEXT,
          min_investment DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (investmentError) {
      console.error('[v0] Error creating investment_options table:', investmentError);
    } else {
      console.log('[v0] ✓ investment_options table created');
    }

    // Create user_investment_preferences table
    const { error: userInvestmentError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investment_preferences(user_id);
      `
    });

    if (userInvestmentError) {
      console.error('[v0] Error creating user_investment_preferences table:', userInvestmentError);
    } else {
      console.log('[v0] ✓ user_investment_preferences table created');
    }

    console.log('[v0] ✓ Database setup completed successfully!');
  } catch (error) {
    console.error('[v0] Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
