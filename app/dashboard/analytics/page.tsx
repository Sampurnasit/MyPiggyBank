'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Calendar,
  IndianRupee,
  Pizza,
  Car,
  ShoppingBag,
  Zap,
  Coffee,
  MoreHorizontal,
  Sparkles,
  TrendingDown,
  LineChart as LineChartIcon
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, isSameDay } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  category: string
  transaction_date: string
  roundup_amount: number
}

const CATEGORY_CONFIG = {
  'Food & Dining': { icon: Pizza, color: '#6366f1', bg: '#eef2ff' }, // Indigo 500
  'Transport': { icon: Car, color: '#8b5cf6', bg: '#f5f3ff' }, // Violet 500
  'Shopping': { icon: ShoppingBag, color: '#a855f7', bg: '#faf5ff' }, // Purple 500
  'Utilities': { icon: Zap, color: '#c084fc', bg: '#fdf4ff' }, // Fuchsia 400
  'Entertainment': { icon: Coffee, color: '#ec4899', bg: '#fdf2f8' }, // Pink 500
  'Other': { icon: MoreHorizontal, color: '#94a3b8', bg: '#f8fafc' }, // Slate 400
}

const containerVars = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const cardVars: any = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 120 }
  }
}

// Animated Counter Component
function AnimatedNumber({ value, prefix = '₹' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const duration = 1500
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplay(end)
        clearInterval(timer)
      } else {
        setDisplay(start)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <span>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const loadAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: true })

        setTransactions(data || [])
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [supabase])

  // Calculated Data Memo
  const analyticsData = useMemo(() => {
    if (transactions.length === 0) return null

    // 1. Category Breakdown
    const categoryMap: Record<string, number> = {}
    let totalSpent = 0
    transactions.forEach(tx => {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount
      totalSpent += tx.amount
    })
    const categoryStats = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      icon: (CATEGORY_CONFIG as any)[name]?.icon || MoreHorizontal,
      color: (CATEGORY_CONFIG as any)[name]?.color || '#94a3b8'
    })).sort((a, b) => b.value - a.value)

    // 2. Monthly Trend (Last 6 Months)
    const monthMap: Record<string, { spent: number; saved: number }> = {}
    transactions.forEach(tx => {
      const monthKey = format(new Date(tx.transaction_date), 'MMM yy')
      if (!monthMap[monthKey]) monthMap[monthKey] = { spent: 0, saved: 0 }
      monthMap[monthKey].spent += tx.amount
      monthMap[monthKey].saved += tx.roundup_amount
    })
    const monthlyStats = Object.entries(monthMap).map(([month, data]) => ({
      month,
      spent: parseFloat(data.spent.toFixed(2)),
      saved: parseFloat(data.saved.toFixed(2))
    })).slice(-6)

    // 3. Daily Transactions (Last 14 Days)
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    })
    const dailyStats = last14Days.map(day => {
      const dayTotal = transactions
        .filter(tx => isSameDay(new Date(tx.transaction_date), day))
        .reduce((sum, tx) => sum + tx.amount, 0)
      return {
        date: format(day, 'MMM d'),
        amount: parseFloat(dayTotal.toFixed(2))
      }
    })

    // 4. Growth Chart (Cumulative Savings)
    let runningTotal = 0
    const growthStats = transactions.map(tx => {
      runningTotal += tx.roundup_amount
      return {
        date: format(new Date(tx.transaction_date), 'MMM d'),
        total: parseFloat(runningTotal.toFixed(2))
      }
    })

    // Metrics
    const now = new Date()
    const currentMonthTx = transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date)
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
    })
    const thisMonthSavings = currentMonthTx.reduce((sum, tx) => sum + tx.roundup_amount, 0)
    const highestCategory = categoryStats[0]
    const avgDailySpending = totalSpent / Math.max((transactions.length > 0 ? (new Date().getTime() - new Date(transactions[0].transaction_date).getTime()) / (1000 * 3600 * 24) : 1), 1)

    return {
      categoryStats,
      monthlyStats,
      dailyStats,
      growthStats,
      metrics: {
        totalSpent,
        totalSaved: runningTotal,
        thisMonthSavings,
        highestCategory,
        avgDailySpending
      }
    }
  }, [transactions])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Synthesizing Insights...</p>
      </div>
    )
  }

  if (!mounted) return null

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/40 rounded-[32px] border border-dashed border-slate-200">
        <Activity className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Not enough data to analyze</h2>
        <p className="text-slate-500 mt-2 max-w-sm">Capture some transactions to unlock advanced financial insights and visual growth charts.</p>
      </div>
    )
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-20 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Financial Insights</h1>
        <p className="text-slate-500 mt-1 font-medium">Visualizing your spending patterns and savings performance.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">This Month</span>
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Savings Impact</h3>
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                <AnimatedNumber value={analyticsData.metrics.thisMonthSavings} />
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                Auto-saved
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Daily Avg</span>
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Burn Rate</h3>
              <p className="text-4xl font-black text-slate-900 tracking-tight">
                <AnimatedNumber value={analyticsData.metrics.avgDailySpending} />
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-violet-600 bg-violet-50 w-fit px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                Per day
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-slate-900 rounded-[32px] overflow-hidden group">
            <CardContent className="p-8 relative">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Top Spend</span>
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Dominant Area</h3>
              <p className="text-3xl font-black text-white tracking-tight relative z-10">
                {analyticsData.metrics.highestCategory?.name || 'Various'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 relative z-10">
                <span className="text-indigo-400">₹{(analyticsData.metrics.highestCategory?.value || 0).toLocaleString()}</span> total spent
              </div>
              {/* Decorative Circle */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Spending Trend (Daily Velocity) */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" />
                Daily Velocity
              </CardTitle>
              <CardDescription>Spending behavior over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.dailyStats}>
                    <defs>
                      <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px'}}
                      cursor={{stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4'}}
                      formatter={(v) => [`₹${v}`, 'Spent']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIndigo)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Share (Pie) */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <PieChartIcon className="w-6 h-6 text-violet-600" />
                Category Share
              </CardTitle>
              <CardDescription>How your budget is distributed</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={400}
                      animationDuration={1500}
                    >
                      {analyticsData.categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px'}}
                       formatter={(v) => `₹${v}`}
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right" 
                      layout="vertical"
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-600 font-bold ml-2 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Performance (Bar) */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Monthly Momentum
              </CardTitle>
              <CardDescription>Spent vs Saved over time</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.monthlyStats} barGap={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px'}}
                      cursor={{fill: '#F8FAFC'}}
                    />
                    <Bar dataKey="spent" fill="#94A3B8" radius={[10, 10, 10, 10]} animationDuration={1500} barSize={14} />
                    <Bar dataKey="saved" fill="#6366f1" radius={[10, 10, 10, 10]} animationDuration={2000} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wealth Accumulation (Growth) */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-slate-900 rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3 text-white">
                <LineChartIcon className="w-6 h-6 text-indigo-400" />
                Wealth Growth
              </CardTitle>
              <CardDescription className="text-slate-500">Cumulative auto-savings impact</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.growthStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#475569', fontSize: 10, fontWeight: 700}}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0F172A', borderRadius: '15px', border: '1px solid #1E293B', color: '#fff', fontWeight: 800}}
                      itemStyle={{color: '#818cf8'}}
                      labelStyle={{color: '#475569', fontSize: '10px'}}
                      formatter={(v) => [`₹${v}`, 'Total Saved']}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="total" 
                      stroke="#818cf8" 
                      strokeWidth={4} 
                      dot={false}
                      animationDuration={3000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Details List */}
      <motion.div variants={cardVars}>
        <Card className="border-none shadow-lg bg-white/40 backdrop-blur-md rounded-[32px] overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xl font-bold">Spending Patterns</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyticsData.categoryStats.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl ring-1 ring-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}10`, color: cat.color }}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Budget Segment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{cat.value.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                      {((cat.value / analyticsData.metrics.totalSpent) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
