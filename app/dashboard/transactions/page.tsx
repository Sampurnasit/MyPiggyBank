'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Tag, 
  IndianRupee, 
  ArrowRight,
  Pizza,
  Car,
  ShoppingBag,
  Zap,
  Coffee,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Trash,
  ArrowUpRight
} from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  transaction_date: string
  roundup_amount: number
  created_at: string
}

const CATEGORIES = [
  { label: 'Food & Dining', value: 'Food & Dining', icon: Pizza, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Transportation', value: 'Transportation', icon: Car, color: 'text-violet-500', bg: 'bg-violet-50' },
  { label: 'Shopping', value: 'Shopping', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Utilities', value: 'Utilities', icon: Zap, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
  { label: 'Entertainment', value: 'Entertainment', icon: Coffee, color: 'text-pink-500', bg: 'bg-pink-50' },
  { label: 'Other', value: 'Other', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .limit(100)

          setTransactions(data || [])
        }
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTransactions()
  }, [supabase])

  const handleDelete = async (transactionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const transaction = transactions.find((t) => t.id === transactionId)
      if (!transaction) return

      // Delete transaction
      await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', user.id)

      // Rollback user balance (Piggy Bank)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_balance')
        .eq('id', user.id)
        .single()

      const newBalance = Math.max((profile?.current_balance || 0) - transaction.roundup_amount, 0)
      await supabase.from('user_profiles').update({ current_balance: newBalance }).eq('id', user.id)

      // Rollback Monthly Stats
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const { data: stats } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single()

      if (stats) {
        await supabase
          .from('monthly_stats')
          .update({
            total_spent: Math.max((stats.total_spent || 0) - transaction.amount, 0),
            total_roundup: Math.max((stats.total_roundup || 0) - transaction.roundup_amount, 0),
            transaction_count: Math.max((stats.transaction_count || 0) - 1, 0),
          })
          .eq('id', stats.id)
      }

      setTransactions((prev) => prev.filter((t) => t.id !== transactionId))
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [transactions, searchTerm])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Reviewing Records...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Activity</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Your spending history and roundup performance.</p>
        </div>
        <Link href="/dashboard/transactions/add">
          <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/20 scale-100 hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" />
            New Expense
          </Button>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 bg-white/40 p-2 rounded-3xl backdrop-blur-sm border border-white/20 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search merchants, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 pr-4 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/10 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/40 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No records found</h3>
            <p className="text-slate-500 max-w-xs mt-2">Try adjusting your filters or record a new transaction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx, index) => {
                const categoryInfo = CATEGORIES.find(c => c.value === tx.category) || CATEGORIES[5]
                const Icon = categoryInfo.icon

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="group"
                  >
                    <div className="bg-white hover:bg-indigo-50/30 transition-all duration-500 p-5 md:p-6 rounded-[28px] shadow-sm hover:shadow-xl ring-1 ring-slate-200 hover:ring-indigo-500/20 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 md:w-14 md:h-14 ${categoryInfo.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                          <Icon className={`w-6 h-6 ${categoryInfo.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                            {tx.description || tx.category}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 font-bold">
                              {format(new Date(tx.transaction_date), 'MMM d, yyyy')}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className={`text-[10px] uppercase tracking-wider font-black ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-bold text-indigo-600 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            ₹{tx.roundup_amount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Roundup</p>
                        </div>
                        
                        <div className="text-right min-w-[80px]">
                          <p className="text-xl font-black text-slate-900">₹{tx.amount.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter block md:hidden">Spent</p>
                        </div>

                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
