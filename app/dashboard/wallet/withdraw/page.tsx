'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PiggyBank, ArrowRight, Wallet } from 'lucide-react'

export default function WithdrawPage() {
  const router = useRouter()
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [piggyBalance, setPiggyBalance] = useState(0)
  const [spendableBalance, setSpendableBalance] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('user_profiles').select('piggy_bank_balance, spendable_balance').eq('id', user.id).single()
        if (data) {
          setPiggyBalance(data.piggy_bank_balance || 0)
          setSpendableBalance(data.spendable_balance || 0)
        }
      }
    }
    load()
  }, [supabase])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('You must be logged in'); return }

      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return }
      if (amt > piggyBalance) { setError(`You only have ₹${piggyBalance.toFixed(2)} in your piggy bank`); return }

      const newPiggy = piggyBalance - amt
      const newSpendable = spendableBalance + amt

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          piggy_bank_balance: newPiggy,
          spendable_balance: newSpendable,
        })
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
        <h1 className="text-3xl font-bold">Withdraw Savings</h1>
        <p className="text-muted-foreground mt-2">Move money from your piggy bank back to spendable balance</p>
      </div>

      <div className="max-w-md">
        <div className="grid gap-4 grid-cols-2 mb-4">
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-6 h-6 text-pink-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Piggy Bank</p>
                  <p className="text-xl font-bold text-pink-700">₹{piggyBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Spendable</p>
                  <p className="text-xl font-bold text-blue-700">₹{spendableBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Withdraw from Piggy Bank</CardTitle>
            <CardDescription>
              Transfer savings back to your spendable wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-6">
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
                  min="0.01"
                  max={piggyBalance}
                  placeholder="Enter amount"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setAmount(String(piggyBalance))}
                >
                  Withdraw all (₹{piggyBalance.toFixed(2)})
                </button>
              </div>

              {parseFloat(amount) > 0 && parseFloat(amount) <= piggyBalance && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <p className="font-medium text-amber-900 flex items-center gap-1">
                    <PiggyBank className="w-4 h-4" /> ₹{parseFloat(amount).toFixed(2)}
                    <ArrowRight className="w-3 h-3" />
                    <Wallet className="w-4 h-4" /> Spendable Balance
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    New piggy bank: ₹{(piggyBalance - parseFloat(amount)).toFixed(2)} | New spendable: ₹{(spendableBalance + parseFloat(amount)).toFixed(2)}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || piggyBalance === 0}>
                {loading ? 'Processing...' : 'Withdraw to Wallet'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
