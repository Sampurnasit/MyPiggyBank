'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, IndianRupee, ArrowRight } from 'lucide-react'

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000]

export default function AddMoneyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)

  // Load current balance
  useState(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('user_profiles').select('spendable_balance').eq('id', user.id).single()
        if (data) setBalance(data.spendable_balance || 0)
      }
    }
    load()
  })

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('You must be logged in'); return }

      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return }
      if (amt > 100000) { setError('Maximum ₹1,00,000 per load'); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('spendable_balance')
        .eq('id', user.id)
        .single()

      const newBalance = (profile?.spendable_balance || 0) + amt

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ spendable_balance: newBalance })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Money</h1>
        <p className="text-muted-foreground mt-2">Load money into your RoundUp wallet</p>
      </div>

      <div className="max-w-md">
        {balance !== null && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Spendable Balance</p>
                  <p className="text-2xl font-bold">₹{balance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Load Wallet
            </CardTitle>
            <CardDescription>
              Add money to your spendable balance. When you log expenses, roundups will automatically go to your piggy bank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMoney} className="space-y-6">
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
                  step="1"
                  min="1"
                  placeholder="Enter amount"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick amounts</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={amount === String(amt) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAmount(String(amt))}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
              </div>

              {parseFloat(amount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-medium text-blue-900 flex items-center gap-1">
                    ₹{parseFloat(amount).toFixed(2)} <ArrowRight className="w-3 h-3" /> Spendable Balance
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    This simulates adding money via UPI/bank transfer
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : `Add ₹${parseFloat(amount || '0').toLocaleString('en-IN')} to Wallet`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
