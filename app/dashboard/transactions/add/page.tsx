'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronLeft, 
  IndianRupee, 
  Tag, 
  Pizza, 
  Car, 
  ShoppingBag, 
  Zap, 
  Coffee, 
  MoreHorizontal,
  ArrowRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  History
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

declare global {
  interface Window {
    Razorpay: any
  }
}

const CATEGORIES = [
  { label: 'Food & Dining', value: 'Food & Dining', icon: Pizza, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Transportation', value: 'Transportation', icon: Car, color: 'text-violet-500', bg: 'bg-violet-50' },
  { label: 'Shopping', value: 'Shopping', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Utilities', value: 'Utilities', icon: Zap, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
  { label: 'Entertainment', value: 'Entertainment', icon: Coffee, color: 'text-pink-500', bg: 'bg-pink-50' },
  { label: 'Other', value: 'Other', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50' },
]

const ROUNDUP_OPTIONS = [
  { value: 'no', label: 'No Roundup' },
  { value: 'nearest_10', label: 'Round up to nearest 10' },
  { value: 'nearest_100', label: 'Round up to nearest 100' },
]

export default function AddTransactionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [razorpayReady, setRazorpayReady] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    roundupOption: 'nearest_10',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  const calculateRoundup = (amount: number, option: string): number => {
    switch (option) {
      case 'nearest_10':
        return Math.ceil(amount / 10) * 10 - amount
      case 'nearest_100':
        return Math.ceil(amount / 100) * 100 - amount
      default:
        return 0
    }
  }

  const roundupAmount = calculateRoundup(parseFloat(formData.amount) || 0, formData.roundupOption)

  const logExpenseWithoutRoundup = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount,
      category: formData.category,
      description: formData.description || null,
      roundup_amount: 0,
      source: 'manual',
    })
    if (txError) throw txError

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
          total_spent: (stats.total_spent || 0) + amount,
          transaction_count: (stats.transaction_count || 0) + 1,
          avg_transaction: ((stats.total_spent || 0) + amount) / ((stats.transaction_count || 0) + 1),
        })
        .eq('id', stats.id)
    } else {
      await supabase.from('monthly_stats').insert({
        user_id: user.id,
        month_year: monthYear,
        total_spent: amount,
        total_roundup: 0,
        transaction_count: 1,
        avg_transaction: amount,
      })
    }
  }

  const openRazorpayForRoundup = async (amount: number, roundup: number) => {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: roundup }),
    })

    const { orderId, error: orderError } = await res.json()
    if (orderError) throw new Error(orderError)

    return new Promise<void>((resolve, reject) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(roundup * 100),
        currency: 'INR',
        name: 'RoundUp Savings',
        description: `Roundup ₹${roundup.toFixed(2)} → Piggy Bank`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-roundup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                roundup_amount: roundup,
                expense_amount: amount,
                category: formData.category,
                description: formData.description,
              }),
            })

            const result = await verifyRes.json()
            if (result.success) {
              resolve()
            } else {
              reject(new Error(result.error || 'Payment verification failed'))
            }
          } catch (err) {
            reject(err)
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled — transaction not recorded'))
          },
        },
        prefill: { email: userEmail },
        theme: { color: '#6366f1' }, // Indigo 500
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      const roundup = calculateRoundup(amount, formData.roundupOption)

      if (roundup > 0) {
        if (!razorpayReady) {
          setError('Payment gateway is still loading, please wait a moment...')
          setLoading(false)
          return
        }
        await openRazorpayForRoundup(amount, roundup)
      } else {
        await logExpenseWithoutRoundup(amount)
      }

      router.push('/dashboard/transactions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayReady(true)}
      />

      <Link href="/dashboard/transactions" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Ledger
      </Link>

      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Add Expense</h1>
        <p className="text-slate-500 mt-1 font-medium">Record your spending and watch your roundups grow.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-indigo-500/10 rounded-[40px] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-10">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Amount Input with Floating Label */}
                <div className="relative group md:col-span-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-20 bg-slate-50 border-none rounded-[32px] px-8 pt-8 pb-2 text-3xl font-black focus-visible:ring-4 focus-visible:ring-indigo-500/10 peer placeholder-transparent"
                    placeholder="0.00"
                  />
                  <label 
                    htmlFor="amount"
                    className="absolute left-8 top-3 text-[12px] font-bold uppercase tracking-widest text-indigo-600 transition-all peer-placeholder-shown:text-xl peer-placeholder-shown:top-6 peer-placeholder-shown:text-slate-400 peer-focus:top-3 peer-focus:text-[12px] peer-focus:text-indigo-600 pointer-events-none"
                  >
                    Expenditure Amount (₹)
                  </label>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                    <IndianRupee className="w-8 h-8 text-slate-200 group-focus-within:text-indigo-100 transition-colors" />
                  </div>
                </div>

                {/* Category Select */}
                <div className="relative">
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="h-16 bg-slate-50 border-none rounded-2xl px-6 pt-7 pb-2 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[28px] border-none shadow-2xl p-2">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="rounded-2xl focus:bg-indigo-50 py-3 mb-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${cat.bg} rounded-xl flex items-center justify-center`}>
                              <cat.icon className={`w-4 h-4 ${cat.color}`} />
                            </div>
                            <span className="font-bold text-slate-700">{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="absolute left-6 top-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 pointer-events-none">
                    Category
                  </label>
                </div>

                {/* Roundup Option */}
                <div className="relative">
                  <Select value={formData.roundupOption} onValueChange={(val) => setFormData({ ...formData, roundupOption: val })}>
                    <SelectTrigger className="h-16 bg-slate-50 border-none rounded-2xl px-6 pt-7 pb-2 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[28px] border-none shadow-2xl p-2">
                      {ROUNDUP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="rounded-2xl focus:bg-indigo-50 py-3 mb-1">
                           <span className="font-bold text-slate-700">{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="absolute left-6 top-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 pointer-events-none">
                    Roundup Preference
                  </label>
                </div>

                {/* Description Input */}
                <div className="relative group md:col-span-2">
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-16 bg-slate-50 border-none rounded-2xl px-6 pt-7 pb-2 text-base font-bold focus-visible:ring-4 focus-visible:ring-indigo-500/10 peer placeholder-transparent"
                    placeholder="e.g. Starbucks"
                  />
                  <label 
                    htmlFor="description"
                    className="absolute left-6 top-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-6 peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-indigo-600 pointer-events-none"
                  >
                    Merchant / Note (Optional)
                  </label>
                </div>
              </div>

              {/* Savings Preview */}
              <AnimatePresence>
                {roundupAmount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="bg-indigo-50/50 border border-indigo-500/10 rounded-[32px] p-6 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-900">Roundup Value</h4>
                        <p className="text-indigo-700/70 text-sm font-medium">Auto-investing via Razorpay</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600">₹{roundupAmount.toFixed(2)}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-4">
                <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.amount}
                    className="h-20 w-full rounded-[32px] bg-slate-900 hover:bg-black text-white text-xl font-bold transition-all shadow-xl hover:shadow-2xl disabled:opacity-30 group py-8"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        {roundupAmount > 0 ? (
                          <>
                            <CreditCard className="w-6 h-6" />
                            Pay & Add Expense
                          </>
                        ) : (
                          <>
                            <History className="w-6 h-6" />
                            Log Transaction
                          </>
                        )}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
