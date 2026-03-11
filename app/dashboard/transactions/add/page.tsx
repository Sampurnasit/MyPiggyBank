'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

declare global {
  interface Window {
    Razorpay: any
  }
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Health & Fitness',
  'Utilities',
  'Subscriptions',
  'Groceries',
  'Coffee',
  'Movies',
  'Clothes',
  'Books',
  'Other',
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
    roundupOption: 'no',
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

    // Just log the transaction with roundup = 0
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount,
      category: formData.category,
      description: formData.description || null,
      roundup_amount: 0,
      source: 'manual',
    })
    if (txError) throw txError

    // Update monthly stats
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
    // Create Razorpay order for the roundup amount
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
        amount: Math.round(roundup * 100), // paise
        currency: 'INR',
        name: 'RoundUp Savings',
        description: `Roundup ₹${roundup.toFixed(2)} → Piggy Bank`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment and log transaction + update piggy bank on server
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
            reject(new Error('Payment cancelled — expense not logged'))
          },
        },
        prefill: { email: userEmail },
        theme: { color: '#ec4899' },
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
          setError('Payment gateway is loading, please try again')
          setLoading(false)
          return
        }
        // Open Razorpay to charge the roundup, which also logs the transaction on success
        await openRazorpayForRoundup(amount, roundup)
      } else {
        // No roundup — just log the expense
        await logExpenseWithoutRoundup(amount)
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayReady(true)}
      />

      <div>
        <h1 className="text-3xl font-bold">Add Expense</h1>
        <p className="text-muted-foreground mt-2">Track your spending and save with roundups</p>
      </div>

      <div className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
            <CardDescription>Log your expense and set roundup preference</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about this expense..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roundup">Roundup Option</Label>
                <Select value={formData.roundupOption} onValueChange={(val) => setFormData({ ...formData, roundupOption: val })}>
                  <SelectTrigger id="roundup">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUNDUP_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {roundupAmount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <p className="font-medium text-green-900">Roundup: ₹{roundupAmount.toFixed(2)}</p>
                  <p className="text-green-700 text-xs mt-1">
                    You&apos;ll pay ₹{roundupAmount.toFixed(2)} via Razorpay — it goes straight to your piggy bank 🐷
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? 'Processing...'
                  : roundupAmount > 0
                    ? `Log Expense & Pay ₹${roundupAmount.toFixed(2)} Roundup`
                    : 'Log Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
