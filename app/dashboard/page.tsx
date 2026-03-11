'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, Plus, Target, Wallet, ArrowDownToLine } from 'lucide-react'
import PiggyBank from '@/components/piggy-bank'

interface UserProfile {
  id: string
  username: string
  spendable_balance: number
  piggy_bank_balance: number
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

      {/* Wallet & Piggy Bank Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Spendable Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">₹{profile.spendable_balance.toFixed(2)}</p>
            <Link href="/dashboard/wallet/add">
              <Button size="sm" variant="outline" className="mt-3 w-full gap-1">
                <Plus className="w-3 h-3" /> Add Money
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Piggy Bank Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <PiggyBank balance={profile.piggy_bank_balance} />
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-700">₹{profile.piggy_bank_balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime saved: ₹{profile.total_saved.toFixed(2)}
                </p>
              </div>
              <Link href="/dashboard/wallet/withdraw">
                <Button size="sm" variant="outline" className="w-full gap-1">
                  <ArrowDownToLine className="w-3 h-3" /> Withdraw
                </Button>
              </Link>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/dashboard/wallet/add">
          <Button className="w-full h-12 text-base" size="lg">
            <Wallet className="w-5 h-5 mr-2" />
            Add Money
          </Button>
        </Link>
        <Link href="/dashboard/transactions/add">
          <Button variant="outline" className="w-full h-12 text-base" size="lg">
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
