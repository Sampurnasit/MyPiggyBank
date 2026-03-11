'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Award, Trophy, Star, Target, Zap, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

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

export default function GamificationPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [weeklyChalls, setWeeklyChallenges] = useState<Challenge[]>([])
  const [monthlyChalls, setMonthlyChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  const currentLevel = LEVELS.find((l) => l.level === profile?.level) || LEVELS[0]
  const nextLevel = LEVELS[profile ? Math.min(profile.level, 9) : 0]
  const xpNeeded = nextLevel.minXP
  const xpProgress = profile ? Math.min((profile.xp_points / xpNeeded) * 100, 100) : 0

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) setProfile(profileData)

        const { data: badgesData } = await supabase
          .from('achievements_badges')
          .select('*')
          .eq('user_id', user.id)

        setBadges(badgesData || [])

        const now = new Date()
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        const weekStartStr = weekStart.toISOString().split('T')[0]

        const { data: weeklyChallengesData } = await supabase
          .from('weekly_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', weekStartStr)

        setWeeklyChallenges(weeklyChallengesData || [])

        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const { data: monthlyChallengesData } = await supabase
          .from('monthly_challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('month_year', monthYear)

        setMonthlyChallenges(monthlyChallengesData || [])

      } catch (error) {
        console.error('Error loading gamification data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (!mounted) return null

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-20 max-w-5xl mx-auto"
    >
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Progress</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Your financial growth, visualized through achievements.</p>
      </div>

      {/* Level & XP Section */}
      {profile && (
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-slate-900 rounded-[40px] overflow-hidden text-white relative">
            <CardHeader className="p-10 pb-0">
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Status</span>
                  </div>
                  <CardTitle className="text-4xl font-black tracking-tight">
                    Level {profile.level} {currentLevel?.emoji}
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-lg">{currentLevel?.name}</CardDescription>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                  <Trophy className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 relative z-10 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Current XP: {profile.xp_points.toLocaleString()}</span>
                  <span>Target: {xpNeeded.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                {profile.level < 10 ? (
                  <p className="text-xs font-bold text-slate-400 italic">
                    {Math.max(0, xpNeeded - profile.xp_points)} XP remaining until you unlock {LEVELS[profile.level]?.name}
                  </p>
                ) : (
                  <p className="text-sm font-black text-indigo-400">
                    Maximum Reputation Achieved! Congratulations, Money Master.
                  </p>
                )}
                <div className="flex gap-1">
                   {[1,2,3,4,5].map(i => (
                     <Star key={i} className={`w-3 h-3 ${i <= (profile.level % 5 || 5) ? 'text-indigo-400 fill-current' : 'text-slate-800'}`} />
                   ))}
                </div>
              </div>
            </CardContent>
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          </Card>
        </motion.div>
      )}

      {/* Badges Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 px-2 flex items-center gap-3">
          <Award className="w-6 h-6 text-indigo-600" />
          Achievement Gallery
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEFAULT_BADGES.map((badge, idx) => {
            const earned = badges.some((b) => b.badge_name === badge.name)
            return (
              <motion.div key={badge.name} variants={cardVars}>
                <Card className={`border-none shadow-xl transition-all duration-300 rounded-[32px] overflow-hidden ${earned ? 'bg-white/80 ring-1 ring-indigo-100' : 'bg-slate-50 opacity-40 grayscale blur-[0.5px]'}`}>
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 transition-transform">
                      {badge.emoji}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{badge.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{badge.description}</p>
                    </div>
                    {earned ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 rounded-full py-1">
                        <ShieldCheck className="w-3 h-3" /> Earned
                      </div>
                    ) : (
                      <div className="text-[10px] font-black text-slate-300 uppercase py-1">Locked</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Weekly Challenges */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 px-2 flex items-center gap-3">
          <Zap className="w-6 h-6 text-indigo-600" />
          Weekly Sprints
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {weeklyChalls.length > 0 ? (
            weeklyChalls.map((challenge) => (
              <motion.div key={challenge.id} variants={cardVars}>
                <Card className={`border-none shadow-xl rounded-[32px] overflow-hidden transition-all ${challenge.is_completed ? 'bg-indigo-600 text-white' : 'bg-white/60 backdrop-blur-md ring-1 ring-slate-100'}`}>
                  <CardHeader className="p-8 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black">{challenge.challenge_name}</CardTitle>
                        <CardDescription className={challenge.is_completed ? 'text-indigo-200' : 'text-slate-500'}>{challenge.description}</CardDescription>
                      </div>
                      <div className={`p-3 rounded-2xl ${challenge.is_completed ? 'bg-white/20' : 'bg-indigo-50'}`}>
                        <Zap className={`w-5 h-5 ${challenge.is_completed ? 'text-white' : 'text-indigo-600'}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-6">
                    <div className="space-y-3">
                      <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest ${challenge.is_completed ? 'text-indigo-200' : 'text-slate-400'}`}>
                        <span>Velocity: {challenge.current_amount}</span>
                        <span>Goal: {challenge.target_amount}</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${challenge.is_completed ? 'bg-white/20' : 'bg-slate-100'}`}>
                        <div
                          className={`h-full rounded-full ${challenge.is_completed ? 'bg-white' : 'bg-indigo-600'}`}
                          style={{ width: `${(challenge.current_amount / challenge.target_amount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                       <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${challenge.is_completed ? 'text-white' : 'text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full'}`}>
                         Reward: {challenge.xp_reward} XP
                       </div>
                       {challenge.is_completed && (
                         <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                           <ShieldCheck className="w-4 h-4" /> Finalized
                         </span>
                       )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 py-10 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold">No active weekly sprints recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Challenges */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 px-2 flex items-center gap-3">
          <Target className="w-6 h-6 text-indigo-600" />
          Endurance Quests
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {monthlyChalls.length > 0 ? (
            monthlyChalls.map((challenge) => (
              <motion.div key={challenge.id} variants={cardVars}>
                <Card className={`border-none shadow-xl rounded-[32px] overflow-hidden transition-all ${challenge.is_completed ? 'bg-slate-900 text-white' : 'bg-white/60 backdrop-blur-md ring-1 ring-slate-100'}`}>
                  <CardHeader className="p-8 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black">{challenge.challenge_name}</CardTitle>
                        <CardDescription className={challenge.is_completed ? 'text-slate-400' : 'text-slate-500'}>{challenge.description}</CardDescription>
                      </div>
                      <div className={`p-3 rounded-2xl ${challenge.is_completed ? 'bg-white/10' : 'bg-indigo-50'}`}>
                        <Target className={`w-5 h-5 ${challenge.is_completed ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-6 space-y-6">
                    <div className="space-y-3">
                      <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest ${challenge.is_completed ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>Progress: {challenge.current_amount}</span>
                        <span>Milestone: {challenge.target_amount}</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${challenge.is_completed ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(challenge.current_amount / challenge.target_amount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                       <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                         Reward: {challenge.xp_reward} XP
                       </div>
                       {challenge.is_completed && (
                         <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1">
                           <Trophy className="w-4 h-4 text-indigo-400" /> Legacy Secured
                         </span>
                       )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 py-10 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold">No active quests found in the vault.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
