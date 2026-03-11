'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Award, Trophy, Star, Target, Zap } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  level: number
  xp_points: number
  spending_personality: string
}

interface Badge {
  id: string
  badge_name: string
  icon_emoji: string
  earned_at: string
}

interface Challenge {
  id: string
  challenge_name: string
  description: string
  target_amount: number
  current_amount: number
  xp_reward: number
  is_completed: boolean
}

const LEVELS = [
  { level: 1, name: 'Seedling', minXP: 0, emoji: '🌱' },
  { level: 2, name: 'Sprout', minXP: 500, emoji: '🌿' },
  { level: 3, name: 'Plant', minXP: 1500, emoji: '🪴' },
  { level: 4, name: 'Tree', minXP: 3000, emoji: '🌳' },
  { level: 5, name: 'Mighty Oak', minXP: 5000, emoji: '🌲' },
  { level: 6, name: 'Forest Guardian', minXP: 7500, emoji: '🦁' },
  { level: 7, name: 'Money Sage', minXP: 10000, emoji: '🧙' },
  { level: 8, name: 'Financial Wizard', minXP: 15000, emoji: '🪄' },
  { level: 9, name: 'Platinum Master', minXP: 20000, emoji: '👑' },
  { level: 10, name: 'Money Master', minXP: 30000, emoji: '💎' },
]

const DEFAULT_BADGES = [
  { name: 'First Saver', emoji: '🎉', description: 'Logged your first transaction' },
  { name: 'Consistent Saver', emoji: '📈', description: '7 consecutive days of saving' },
  { name: 'Roundup Champion', emoji: '💰', description: 'Saved ₹1000 through roundups' },
  { name: 'Spender Analyst', emoji: '📊', description: 'Analyzed your spending patterns' },
  { name: 'Budget Boss', emoji: '🎯', description: 'Completed a monthly challenge' },
  { name: 'Emergency Fund Hero', emoji: '🦸', description: 'Saved ₹5000 total' },
  { name: 'Investment Explorer', emoji: '📈', description: 'Explored investment options' },
  { name: 'Milestone Master', emoji: '🏆', description: 'Reached level 5' },
]

const DEFAULT_CHALLENGES = [
  {
    name: 'Save for Coffee',
    description: 'Save ₹100 through roundups this week',
    target: 100,
    emoji: '☕',
  },
  {
    name: 'Savings Sprint',
    description: 'Log 10 transactions in a week',
    target: 10,
    emoji: '🏃',
  },
  {
    name: 'Zero Waste Week',
    description: 'Spend less than ₹2000 this week',
    target: 2000,
    emoji: '🌱',
  },
  {
    name: 'Lunch Money',
    description: 'Save ₹500 through roundups this month',
    target: 500,
    emoji: '🍱',
  },
]

export default function GamificationPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [weeklyChalls, setWeeklyChallenges] = useState<Challenge[]>([])
  const [monthlyChalls, setMonthlyChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const currentLevel = LEVELS.find((l) => l.level === profile?.level) || LEVELS[0]
  const nextLevel = LEVELS[profile ? Math.min(profile.level, 9) : 0]
  const xpNeeded = nextLevel.minXP
  const xpProgress = profile ? Math.min((profile.xp_points / xpNeeded) * 100, 100) : 0

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

        // Fetch badges
        const { data: badgesData } = await supabase
          .from('achievements_badges')
          .select('*')
          .eq('user_id', user.id)

        setBadges(badgesData || [])

        // Fetch weekly challenges
        const now = new Date()
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        const weekStartStr = weekStart.toISOString().split('T')[0]

        const { data: weeklyChallengesData } = await supabase
          .from('weekly_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', weekStartStr)

        setWeeklyChallenges(weeklyChallengesData || [])

        // Fetch monthly challenges
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const { data: monthlyChallengesData } = await supabase
          .from('monthly_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('month_year', monthYear)

        setMonthlyChallenges(monthlyChallengesData || [])

        // Initialize default challenges if needed
        if (!weeklyChallengesData || weeklyChallengesData.length === 0) {
          initializeWeeklyChallenges(user.id, weekStartStr)
        }
        if (!monthlyChallengesData || monthlyChallengesData.length === 0) {
          initializeMonthlyChallenges(user.id, monthYear)
        }
      } catch (error) {
        console.error('[v0] Error loading gamification data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const initializeWeeklyChallenges = async (userId: string, weekStart: string) => {
    const now = new Date()
    const weekStartDate = new Date(now)
    weekStartDate.setDate(now.getDate() - now.getDay())

    for (const challenge of DEFAULT_CHALLENGES.slice(0, 2)) {
      await supabase.from('weekly_challenges').insert({
        user_id: userId,
        week_start: weekStart,
        challenge_name: challenge.name,
        description: challenge.description,
        target_amount: challenge.target,
        current_amount: 0,
        xp_reward: 100,
        is_completed: false,
      })
    }
  }

  const initializeMonthlyChallenges = async (userId: string, monthYear: string) => {
    for (const challenge of DEFAULT_CHALLENGES.slice(2, 4)) {
      await supabase.from('monthly_challenges').insert({
        user_id: userId,
        month_year: monthYear,
        challenge_name: challenge.name,
        description: challenge.description,
        target_amount: challenge.target,
        current_amount: 0,
        xp_reward: 500,
        is_completed: false,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading gamification data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Progress & Gamification</h1>
        <p className="text-muted-foreground mt-2">Track your savings journey and achievements</p>
      </div>

      {/* Level & XP Section */}
      {profile && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-100">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Level {profile.level} {currentLevel?.emoji}
                </CardTitle>
                <CardDescription>{currentLevel?.name}</CardDescription>
              </div>
              <Trophy className="w-8 h-8 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Experience Points</span>
                <span className="font-medium">
                  {profile.xp_points.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>

            {profile.level < 10 && (
              <p className="text-sm text-muted-foreground">
                {Math.max(0, xpNeeded - profile.xp_points)} XP until next level
              </p>
            )}

            {profile.level === 10 && (
              <p className="text-sm font-semibold text-amber-700">
                You've reached the maximum level! Congratulations, Money Master!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Badges Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Badges & Achievements</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {DEFAULT_BADGES.map((badge) => {
            const earned = badges.some((b) => b.badge_name === badge.name)
            return (
              <Card key={badge.name} className={earned ? 'bg-amber-50' : 'opacity-50'}>
                <CardContent className="pt-6 text-center space-y-2">
                  <div className={`text-4xl ${earned ? '' : 'grayscale'}`}>{badge.emoji}</div>
                  <div>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                  {earned && (
                    <p className="text-xs text-green-600 font-medium">✓ Earned</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Weekly Challenges */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Weekly Challenges</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {weeklyChalls.length > 0 ? (
            weeklyChalls.map((challenge) => (
              <Card key={challenge.id} className={challenge.is_completed ? 'bg-green-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{challenge.challenge_name}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">
                        {challenge.current_amount} / {challenge.target_amount}
                      </span>
                    </div>
                    <Progress
                      value={(challenge.current_amount / challenge.target_amount) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Reward: {challenge.xp_reward} XP
                    </span>
                    {challenge.is_completed && (
                      <span className="text-xs font-semibold text-green-600">✓ Complete</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-2">No weekly challenges yet</p>
          )}
        </div>
      </div>

      {/* Monthly Challenges */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Monthly Challenges</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {monthlyChalls.length > 0 ? (
            monthlyChalls.map((challenge) => (
              <Card key={challenge.id} className={challenge.is_completed ? 'bg-green-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{challenge.challenge_name}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">
                        {challenge.current_amount} / {challenge.target_amount}
                      </span>
                    </div>
                    <Progress
                      value={(challenge.current_amount / challenge.target_amount) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Reward: {challenge.xp_reward} XP
                    </span>
                    {challenge.is_completed && (
                      <span className="text-xs font-semibold text-green-600">✓ Complete</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-2">No monthly challenges yet</p>
          )}
        </div>
      </div>

      {/* Spending Personality */}
      {profile && profile.spending_personality && profile.spending_personality !== 'unknown' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Spending Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize mb-2">{profile.spending_personality}</p>
            <p className="text-muted-foreground">
              Based on your spending patterns, you're a {profile.spending_personality}. This means
              your spending habits reflect this personality type. Keep tracking to discover more about
              your financial behavior!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
