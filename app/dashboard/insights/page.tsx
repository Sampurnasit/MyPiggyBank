'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Zap, TrendingUp, Sparkles, Activity, PieChart, ShieldCheck, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  category: string
  transaction_date: string
  roundup_amount: number
}

interface PersonalityProfile {
  type: string
  emoji: string
  description: string
  traits: string[]
  strengths: string[]
  improvements: string[]
}

const PERSONALITIES: Record<string, PersonalityProfile> = {
  lion: {
    type: 'Lion',
    emoji: '🦁',
    description: 'The Fearless Spender',
    traits: ['Confident', 'Adventurous', 'Social', 'Generous'],
    strengths: ['Quick decision maker', 'Enjoys life', 'Generous with friends'],
    improvements: ['Budget more carefully', 'Plan major purchases', 'Save for unexpected expenses'],
  },
  bee: {
    type: 'Bee',
    emoji: '🐝',
    description: 'The Busy Achiever',
    traits: ['Hardworking', 'Goal-oriented', 'Active', 'Practical'],
    strengths: ['Earns well', 'Focused on goals', 'Efficient with time'],
    improvements: ['Take more breaks', 'Enjoy small pleasures', 'Invest in wellness'],
  },
  fox: {
    type: 'Fox',
    emoji: '🦊',
    description: 'The Smart Saver',
    traits: ['Clever', 'Strategic', 'Cautious', 'Analytical'],
    strengths: ['Great at finding deals', 'Long-term planning', 'Risk-aware'],
    improvements: ['Be more spontaneous', 'Enjoy rewards', 'Invest in experiences'],
  },
  turtle: {
    type: 'Turtle',
    emoji: '🐢',
    description: 'The Steady Saver',
    traits: ['Patient', 'Reliable', 'Thoughtful', 'Conservative'],
    strengths: ['Consistent saver', 'Low risk', 'Disciplined'],
    improvements: ['Explore new experiences', 'Take calculated risks', 'Enjoy your savings'],
  },
  butterfly: {
    type: 'Butterfly',
    emoji: '🦋',
    description: 'The Spontaneous Optimizer',
    traits: ['Flexible', 'Creative', 'Fun-loving', 'Impulsive'],
    strengths: ['Adapts quickly', 'Enjoys variety', 'Creative problem solver'],
    improvements: ['Plan ahead more', 'Track spending', 'Set clear goals'],
  },
  eagle: {
    type: 'Eagle',
    emoji: '🦅',
    description: 'The Vision Planner',
    traits: ['Strategic', 'Visionary', 'Ambitious', 'Independent'],
    strengths: ['Big picture thinker', 'Self-reliant', 'Growth-focused'],
    improvements: ['Balance vision with present', 'Celebrate small wins', 'Build support network'],
  },
}

const ROASTS = [
  "You're spending like your salary is infinite. Newsflash: it isn't! 😄",
  "Saving ₹{saved} from ₹{spent} spent? That's the spirit! Keep it up! 🚀",
  "Your piggy bank is getting chubby. Those roundups are adding up! 🐷",
  "Coffee? More like 'Coffee and Another Coffee' amirite? ☕☕",
  "You're basically keeping the delivery apps in business. Thanks for your service! 🚗",
  "That shopping spree though! Your wardrobe called—it's overwhelmed. 👗",
  "You save ₹{savings_percent}% of your spending. Better than doing nothing! 💪",
  "Entertainment spending is real. At least you're having fun while you're broke! 🎬",
  "Your roundup savings could buy {coffee_count} coffees! Or 1 fancy lunch. 🍕",
  "Consistent spender. I respect the predictability. Very organized chaos! 📊",
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

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null)
  const [roast, setRoast] = useState('')
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalSaved: 0,
    topCategory: '',
    savingsPercent: 0,
    avgTransaction: 0,
  })
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const loadInsights = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (!txData) {
          setLoading(false)
          return
        }

        setTransactions(txData)

        const totalSpent = txData.reduce((sum, tx) => sum + tx.amount, 0)
        const totalSaved = txData.reduce((sum, tx) => sum + tx.roundup_amount, 0)

        const categoryMap: Record<string, number> = {}
        txData.forEach((tx) => {
          categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount
        })

        const topCategory = Object.keys(categoryMap).length > 0 
          ? Object.keys(categoryMap).reduce((a, b) => categoryMap[a] > categoryMap[b] ? a : b)
          : 'None'

        const savingsPercent = totalSpent > 0 ? (totalSaved / totalSpent) * 100 : 0
        const avgTransaction = txData.length > 0 ? totalSpent / txData.length : 0

        setStats({
          totalSpent,
          totalSaved,
          topCategory,
          savingsPercent: Math.round(savingsPercent),
          avgTransaction,
        })

        detectPersonality(categoryMap, totalSpent, totalSaved, txData.length)
        generateRoast(totalSpent, totalSaved, savingsPercent, topCategory)
      } catch (error) {
        console.error('Error loading insights:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [supabase])

  const detectPersonality = (
    categoryMap: Record<string, number>,
    totalSpent: number,
    totalSaved: number,
    transactionCount: number
  ) => {
    if (transactionCount === 0) return
    const topCategory = Object.keys(categoryMap).reduce((a, b) => categoryMap[a] > categoryMap[b] ? a : b)
    const savingsPercent = totalSpent > 0 ? (totalSaved / totalSpent) * 100 : 0
    const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0

    let personalityType = 'fox'

    if (categoryMap['Entertainment'] > totalSpent * 0.25) {
      personalityType = 'lion'
    } else if (categoryMap['Food & Dining'] > totalSpent * 0.3) {
      personalityType = 'butterfly'
    } else if (savingsPercent > 30) {
      personalityType = 'turtle'
    } else if (categoryMap['Shopping'] > totalSpent * 0.2) {
      personalityType = 'butterfly'
    } else if (categoryMap['Subscriptions'] > totalSpent * 0.1) {
      personalityType = 'bee'
    } else if (avgTransaction > 2000) {
      personalityType = 'eagle'
    }

    setPersonality(PERSONALITIES[personalityType])
  }

  const generateRoast = (
    totalSpent: number,
    totalSaved: number,
    savingsPercent: number,
    topCategory: string
  ) => {
    let selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)]
    selectedRoast = selectedRoast.replace('{spent}', totalSpent.toFixed(0))
    selectedRoast = selectedRoast.replace('{saved}', totalSaved.toFixed(0))
    selectedRoast = selectedRoast.replace('{savings_percent}', Math.round(savingsPercent).toString())
    selectedRoast = selectedRoast.replace('{coffee_count}', Math.round(totalSaved / 150).toString())
    setRoast(selectedRoast)
  }

  const refreshRoast = () => {
    if (stats.totalSpent > 0) {
      generateRoast(stats.totalSpent, stats.totalSaved, stats.savingsPercent, stats.topCategory)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Analyzing Behavioral Patterns...</p>
      </div>
    )
  }

  if (!mounted) return null

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/40 rounded-[32px] border border-dashed border-slate-200">
        <Activity className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Psychology Locked</h2>
        <p className="text-slate-500 mt-2 max-w-sm">We need at least 1 record to calculate your behavioral profile and financial personality.</p>
      </div>
    )
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-10 max-w-5xl mx-auto pb-20"
    >
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Behavioral Insights</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Your spending habit psychology, translated into data.</p>
      </div>

      {personality && (
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-2xl bg-indigo-600 rounded-[40px] overflow-hidden text-white relative">
            <CardHeader className="p-10 pb-0">
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-200">
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Archetype</span>
                  </div>
                  <CardTitle className="text-4xl font-black tracking-tight">{personality.emoji} {personality.type}</CardTitle>
                  <CardDescription className="text-indigo-100/70 font-bold text-lg">{personality.description}</CardDescription>
                </div>
                <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/10">
                   <Zap className="w-10 h-10 text-white fill-current" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8 relative z-10">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Core Traits</p>
                <div className="flex flex-wrap gap-2">
                  {personality.traits.map((trait) => (
                    <span key={trait} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black border border-white/10">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4">Strategic Strengths</p>
                  <ul className="space-y-3">
                    {personality.strengths.map((strength) => (
                      <li key={strength} className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" /> {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-slate-900 rounded-[32px] border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Growth Vectors</p>
                  <ul className="space-y-3">
                    {personality.improvements.map((improvement) => (
                      <li key={improvement} className="text-sm font-bold flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-indigo-500" /> {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          </Card>
        </motion.div>
      )}

      {/* Daily Roast */}
      <motion.div variants={cardVars}>
        <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Algorithmic Roast</span>
                </div>
                <CardTitle className="text-2xl font-black">Financial Commentary</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={refreshRoast} className="h-10 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold gap-2">
                <RefreshCw className="w-4 h-4" />
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            <div className="p-8 bg-slate-950 rounded-[24px] relative overflow-hidden group">
               <p className="text-xl font-bold text-white italic relative z-10 leading-relaxed">"{roast}"</p>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 relative z-10">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Dynamic Insight Engine v4.2
               </div>
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Spending Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Total Volume', value: `₹${stats.totalSpent.toFixed(2)}`, sub: `${transactions.length} Active Records`, icon: TrendingUp },
          { label: 'Avg Velocity', value: `₹${stats.avgTransaction.toFixed(2)}`, sub: 'Per transaction event', icon: Activity },
          { label: 'Savings Efficiency', value: `${stats.savingsPercent}%`, sub: 'Capital retention rate', icon: ShieldCheck, accent: true },
        ].map((item, idx) => (
          <motion.div key={item.label} variants={cardVars}>
            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px]">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.accent ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-600'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                <p className={`text-2xl font-black tracking-tight ${item.accent ? 'text-indigo-600' : 'text-slate-900'}`}>{item.value}</p>
                <p className="text-xs font-bold text-slate-400 mt-1 italic">{item.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Category & Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-8 pb-0">
               <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                 <PieChart className="w-4 h-4" /> Dominant Vertical
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <div className="space-y-4">
                <p className="text-4xl font-black text-slate-900 capitalize tracking-tighter">{stats.topCategory}</p>
                <p className="text-sm font-bold text-slate-500">
                  This segment accounts for <span className="text-indigo-600">{((transactions.filter((t) => t.category === stats.topCategory).reduce((sum, t) => sum + t.amount, 0) / stats.totalSpent) * 100).toFixed(1)}%</span> of your total financial output.
                </p>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-indigo-600" style={{ width: `${(transactions.filter((t) => t.category === stats.topCategory).reduce((sum, t) => sum + t.amount, 0) / stats.totalSpent) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-slate-900 rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-8 pb-0">
               <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-indigo-400" /> Strategic Tips
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-4">
              {[
                stats.savingsPercent < 10 && "Your savings rate is below the 10% benchmark. Increase roundups to 100.",
                transactions.length > 20 && "Consistency detected. Your behavioral profile is 94% accurate.",
                stats.topCategory === 'Food & Dining' && "Nutritional costs are high. Explore subscription-based meal planning.",
                stats.topCategory === 'Entertainment' && "Dopamine costs are peaking. Cap monthly leisure budgets.",
                stats.topCategory === 'Shopping' && "Apply the 24-hour cooling period to non-essential imports.",
              ].filter(Boolean).map((tip, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <p className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
