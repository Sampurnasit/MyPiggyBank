// Database type definitions for RoundUp
export type Tables = {
  user_profiles: {
    Row: {
      id: string
      username: string
      full_name: string | null
      avatar_url: string | null
      spendable_balance: number
      piggy_bank_balance: number
      total_saved: number
      xp_points: number
      level: number
      spending_personality: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id: string
      username: string
      full_name?: string | null
      avatar_url?: string | null
      spendable_balance?: number
      piggy_bank_balance?: number
      total_saved?: number
      xp_points?: number
      level?: number
      spending_personality?: string
    }
    Update: {
      username?: string
      full_name?: string | null
      avatar_url?: string | null
      spendable_balance?: number
      piggy_bank_balance?: number
      total_saved?: number
      xp_points?: number
      level?: number
      spending_personality?: string
      updated_at?: string
    }
  }
  transactions: {
    Row: {
      id: string
      user_id: string
      amount: number
      category: string
      description: string | null
      transaction_date: string
      source: string
      roundup_amount: number
      created_at: string
    }
    Insert: {
      user_id: string
      amount: number
      category: string
      description?: string | null
      transaction_date?: string
      source?: string
      roundup_amount?: number
    }
    Update: {
      amount?: number
      category?: string
      description?: string | null
      transaction_date?: string
      source?: string
      roundup_amount?: number
    }
  }
  achievements_badges: {
    Row: {
      id: string
      user_id: string
      badge_name: string
      description: string | null
      icon_emoji: string | null
      earned_at: string
    }
    Insert: {
      user_id: string
      badge_name: string
      description?: string | null
      icon_emoji?: string | null
    }
    Update: {
      badge_name?: string
      description?: string | null
      icon_emoji?: string | null
    }
  }
  weekly_challenges: {
    Row: {
      id: string
      user_id: string
      challenge_name: string
      description: string | null
      target_amount: number | null
      current_amount: number
      xp_reward: number
      is_completed: boolean
      week_start: string
      created_at: string
    }
    Insert: {
      user_id: string
      challenge_name: string
      description?: string | null
      target_amount?: number | null
      current_amount?: number
      xp_reward?: number
      is_completed?: boolean
      week_start: string
    }
    Update: {
      challenge_name?: string
      description?: string | null
      target_amount?: number | null
      current_amount?: number
      xp_reward?: number
      is_completed?: boolean
      week_start?: string
    }
  }
  monthly_challenges: {
    Row: {
      id: string
      user_id: string
      challenge_name: string
      description: string | null
      target_amount: number | null
      current_amount: number
      xp_reward: number
      is_completed: boolean
      month_year: string
      created_at: string
    }
    Insert: {
      user_id: string
      challenge_name: string
      description?: string | null
      target_amount?: number | null
      current_amount?: number
      xp_reward?: number
      is_completed?: boolean
      month_year: string
    }
    Update: {
      challenge_name?: string
      description?: string | null
      target_amount?: number | null
      current_amount?: number
      xp_reward?: number
      is_completed?: boolean
      month_year?: string
    }
  }
  monthly_stats: {
    Row: {
      id: string
      user_id: string
      month_year: string
      total_spent: number
      total_saved: number
      total_roundup: number
      avg_transaction: number
      transaction_count: number
      created_at: string
    }
    Insert: {
      user_id: string
      month_year: string
      total_spent?: number
      total_saved?: number
      total_roundup?: number
      avg_transaction?: number
      transaction_count?: number
    }
    Update: {
      total_spent?: number
      total_saved?: number
      total_roundup?: number
      avg_transaction?: number
      transaction_count?: number
    }
  }
  investment_options: {
    Row: {
      id: string
      name: string
      description: string | null
      expected_return_rate: number | null
      risk_level: string | null
      min_investment: number | null
      created_at: string
    }
    Insert: {
      name: string
      description?: string | null
      expected_return_rate?: number | null
      risk_level?: string | null
      min_investment?: number | null
    }
    Update: {
      name?: string
      description?: string | null
      expected_return_rate?: number | null
      risk_level?: string | null
      min_investment?: number | null
    }
  }
  user_investment_preferences: {
    Row: {
      id: string
      user_id: string
      investment_id: string
      monthly_sip: number
      total_invested: number
      projected_1yr: number
      projected_3yr: number
      projected_5yr: number
      created_at: string
    }
    Insert: {
      user_id: string
      investment_id: string
      monthly_sip?: number
      total_invested?: number
      projected_1yr?: number
      projected_3yr?: number
      projected_5yr?: number
    }
    Update: {
      monthly_sip?: number
      total_invested?: number
      projected_1yr?: number
      projected_3yr?: number
      projected_5yr?: number
    }
  }
}
