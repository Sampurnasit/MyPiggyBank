import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/supabase-types'

/**
 * User Profile Operations
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Tables['user_profiles']['Row'] | null
}

export async function createUserProfile(
  userId: string,
  username: string,
  fullName?: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        username,
        full_name: fullName || null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Tables['user_profiles']['Row']
}

export async function updateUserProfile(
  userId: string,
  updates: Tables['user_profiles']['Update']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Tables['user_profiles']['Row']
}

/**
 * Transaction Operations
 */
export async function getTransactions(userId: string, limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Tables['transactions']['Row'][]
}

export async function addTransaction(
  userId: string,
  transaction: Omit<Tables['transactions']['Insert'], 'user_id'>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        ...transaction,
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Tables['transactions']['Row']
}

export async function deleteTransaction(transactionId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Badges/Achievements Operations
 */
export async function getUserBadges(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('achievements_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) throw error
  return data as Tables['achievements_badges']['Row'][]
}

export async function awardBadge(
  userId: string,
  badgeName: string,
  description?: string,
  iconEmoji?: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('achievements_badges')
    .insert([
      {
        user_id: userId,
        badge_name: badgeName,
        description: description || null,
        icon_emoji: iconEmoji || null,
      },
    ])
    .select()
    .single()

  if (error && error.message.includes('duplicate')) {
    // Badge already exists, that's ok
    return null
  }
  if (error) throw error
  return data as Tables['achievements_badges']['Row'] | null
}

/**
 * Weekly Challenges Operations
 */
export async function getWeeklyChallenges(userId: string, weekStart: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)

  if (error) throw error
  return data as Tables['weekly_challenges']['Row'][]
}

export async function createWeeklyChallenge(
  userId: string,
  challenge: Omit<Tables['weekly_challenges']['Insert'], 'user_id'>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_challenges')
    .insert([
      {
        ...challenge,
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error && !error.message.includes('duplicate')) throw error
  return data as Tables['weekly_challenges']['Row'] | null
}

export async function updateWeeklyChallenge(
  userId: string,
  challengeId: string,
  updates: Tables['weekly_challenges']['Update']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_challenges')
    .update(updates)
    .eq('id', challengeId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Tables['weekly_challenges']['Row']
}

/**
 * Monthly Challenges Operations
 */
export async function getMonthlyChallenges(userId: string, monthYear: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)

  if (error) throw error
  return data as Tables['monthly_challenges']['Row'][]
}

export async function createMonthlyChallenge(
  userId: string,
  challenge: Omit<Tables['monthly_challenges']['Insert'], 'user_id'>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_challenges')
    .insert([
      {
        ...challenge,
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error && !error.message.includes('duplicate')) throw error
  return data as Tables['monthly_challenges']['Row'] | null
}

export async function updateMonthlyChallenge(
  userId: string,
  challengeId: string,
  updates: Tables['monthly_challenges']['Update']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_challenges')
    .update(updates)
    .eq('id', challengeId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Tables['monthly_challenges']['Row']
}

/**
 * Monthly Stats Operations
 */
export async function getMonthlyStats(userId: string, monthYear: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .single()

  if (error && error.code === 'PGRST116') {
    // Not found, that's ok
    return null
  }
  if (error) throw error
  return data as Tables['monthly_stats']['Row'] | null
}

export async function updateMonthlyStats(
  userId: string,
  monthYear: string,
  updates: Tables['monthly_stats']['Update']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_stats')
    .upsert([
      {
        user_id: userId,
        month_year: monthYear,
        ...updates,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Tables['monthly_stats']['Row']
}

/**
 * Investment Operations
 */
export async function getInvestmentOptions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('investment_options')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Tables['investment_options']['Row'][]
}

export async function getUserInvestments(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_investment_preferences')
    .select(`
      *,
      investment_options (*)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data as any[]
}

export async function addUserInvestment(
  userId: string,
  investment: Omit<Tables['user_investment_preferences']['Insert'], 'user_id'>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_investment_preferences')
    .insert([
      {
        ...investment,
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Tables['user_investment_preferences']['Row']
}

export async function updateUserInvestment(
  userId: string,
  investmentId: string,
  updates: Tables['user_investment_preferences']['Update']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_investment_preferences')
    .update(updates)
    .eq('id', investmentId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Tables['user_investment_preferences']['Row']
}
