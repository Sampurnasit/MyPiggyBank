'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  TrendingUp, 
  Plus, 
  Target, 
  Wallet, 
  ArrowDownToLine,
  Activity,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react'
import PiggyBank from '@/components/piggy-bank'
import { motion } from 'framer-motion'

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

const containerVars = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const cardVars: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 120 }
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'
          await supabase.from('user_profiles').upsert(
            { id: user.id, username },
            { onConflict: 'id', ignoreDuplicates: true }
          )

          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileData) setProfile(profileData)

          const now = new Date()
          const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

          const { data: statsData } = await supabase
            .from('monthly_stats')
            .select('*')
            .eq('user_id', user.id)
            .eq('month_year', monthYear)
            .single()

          if (statsData) setStats(statsData)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Dashboard...</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-20 max-w-6xl mx-auto"
    >
      {/* Welcome Section */}
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Hey, {profile.username}!</h1>
        <p className="text-slate-500 mt-1 font-medium italic">
          Level {profile.level} Explorer • {profile.xp_points} XP earned this season
        </p>
      </div>

      {/* Main Balances Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Spendable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-slate-900 tracking-tight">₹{profile.spendable_balance.toFixed(2)}</p>
              <Link href="/dashboard/wallet/add">
                <Button size="sm" variant="ghost" className="mt-4 w-full h-10 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold gap-2">
                  <Plus className="w-4 h-4" /> Top Up
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Piggy Bank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <PiggyBank balance={profile.piggy_bank_balance} />
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-900 tracking-tight">₹{profile.piggy_bank_balance.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    Lifetime saved: ₹{profile.total_saved.toFixed(2)}
                  </p>
                </div>
                <Link href="/dashboard/wallet/withdraw">
                  <Button size="sm" variant="ghost" className="w-full h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold gap-2">
                    <ArrowDownToLine className="w-4 h-4" /> Withdraw
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVars} className="md:col-span-1">
          <Card className="border-none shadow-xl bg-slate-900 rounded-[32px] overflow-hidden group h-full">
            <CardContent className="p-8 relative h-full flex flex-col justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Current Month
                </CardTitle>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Total Expenses</p>
                    <p className="text-2xl font-black text-white">₹{stats?.total_spent.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Roundup Impact</p>
                    <p className="text-2xl font-black text-indigo-400">₹{stats?.total_roundup.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{stats?.transaction_count || 0} Successful Transactions</p>
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Add Money', icon: Wallet, href: '/dashboard/wallet/add', primary: true },
          { label: 'Add Expense', icon: Plus, href: '/dashboard/transactions/add' },
          { label: 'Performance', icon: TrendingUp, href: '/dashboard/analytics' },
          { label: 'Challenges', icon: Target, href: '/dashboard/gamification' },
        ].map((action, idx) => (
          <motion.div key={action.label} variants={cardVars}>
            <Link href={action.href}>
              <Button 
                variant={action.primary ? "default" : "outline"}
                className={`w-full h-14 rounded-2xl font-bold flex items-center justify-between px-6 group transition-all ${action.primary ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-white/50 border-none shadow-sm ring-1 ring-slate-100 hover:bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <action.icon className={`w-5 h-5 ${action.primary ? 'text-white' : 'text-indigo-600'}`} />
                  <span className={action.primary ? 'text-white' : 'text-slate-900'}>{action.label}</span>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${action.primary ? 'text-white/50' : 'text-slate-300'}`} />
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Personality Banner */}
      {profile.spending_personality !== 'unknown' && (
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-lg bg-indigo-600 rounded-[32px] overflow-hidden text-white relative">
            <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Zap className="w-4 h-4 fill-current" />
                  <span className="text-xs font-black uppercase tracking-widest">AI Profile Unlocked</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight capitalize">{profile.spending_personality}</h3>
                <p className="text-indigo-100/70 max-w-md font-medium">Your spending habits show a unique pattern. View detailed insights to optimize your financial growth.</p>
              </div>
              <Link href="/dashboard/insights">
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-6 rounded-xl font-black">
                  View Insights
                </Button>
              </Link>
            </CardContent>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
