'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, Plus, Target } from 'lucide-react'
import PiggyBank from '@/components/piggy-bank'

interface UserProfile {
  id: string
  username: string
  current_balance: number
  total_saved: number
  level: number
  xp_points: number
  spending_personality: string
}

interface MonthlyStats {
  total_spent: number
  total_roundup: number
  transaction_count: number
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Upsert user profile (creates it on first login if it doesn't exist)
          const username =
            user.user_metadata?.username || user.email?.split('@')[0] || 'User'
          await supabase.from('user_profiles').upsert(
            { id: user.id, username },
            { onConflict: 'id', ignoreDuplicates: true }
          )

          // Fetch user profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }

          // Fetch current month stats
          const now = new Date()
          const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

          const { data: statsData } = await supabase
            .from('monthly_stats')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_year', monthYear)
            .single()

          if (statsData) {
            setStats(statsData)
          }
        }
      } catch (error) {
        console.error('[v0] Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold mb-4">Profile not found</p>
        <Link href="/auth/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Welcome back, {profile.username}!</h1>
        <p className="text-muted-foreground">
          Level {profile.level} • {profile.xp_points} XP points
        </p>
      </div>

      {/* Piggy Bank Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PiggyBank balance={profile.current_balance} />
              <div className="text-center">
                <p className="text-3xl font-bold">₹{profile.current_balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Saved: ₹{profile.total_saved.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>This Month</CardTitle>
            <CardDescription>Your spending overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ₹{stats?.total_spent.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Roundup Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats?.total_roundup.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats?.transaction_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/transactions/add">
          <Button className="w-full h-12 text-base" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
        </Link>
        <Link href="/dashboard/analytics">
          <Button variant="outline" className="w-full h-12 text-base" size="lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Analytics
          </Button>
        </Link>
        <Link href="/dashboard/gamification">
          <Button variant="outline" className="w-full h-12 text-base" size="lg">
            <Target className="w-5 h-5 mr-2" />
            View Challenges
          </Button>
        </Link>
      </div>

      {/* Spending Personality */}
      {profile.spending_personality !== 'unknown' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Spending Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{profile.spending_personality}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This is determined based on your spending patterns and habits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
