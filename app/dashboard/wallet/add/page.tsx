'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, IndianRupee, CreditCard, Shield } from 'lucide-react'

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000]

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function AddMoneyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    // Load current balance
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const { data } = await supabase.from('user_profiles').select('spendable_balance').eq('id', user.id).single()
        if (data) setBalance(data.spendable_balance || 0)
      }
    }
    load()

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [supabase])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); setLoading(false); return }
      if (amt > 100000) { setError('Maximum ₹1,00,000 per transaction'); setLoading(false); return }

      // Create order on backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'RoundUp',
        description: `Add ₹${amt} to Wallet`,
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Verify payment on backend
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            }),
          })

          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            router.push('/dashboard')
          } else {
            setError('Payment verification failed. Contact support.')
          }
        },
        prefill: { email: userEmail },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => { setLoading(false) },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Money</h1>
        <p className="text-muted-foreground mt-2">Load money into your RoundUp wallet via UPI, Card, or Netbanking</p>
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
              Pay via UPI, Debit/Credit Card, or Netbanking. Roundups on expenses go to your piggy bank automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-6">
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

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Secured by Razorpay. 100% safe payments.</span>
              </div>

              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={loading}>
                <CreditCard className="w-5 h-5" />
                {loading ? 'Processing...' : `Pay ₹${parseFloat(amount || '0').toLocaleString('en-IN')}`}
              </Button>

              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <span>💳 Cards</span>
                <span>📱 UPI</span>
                <span>🏦 Netbanking</span>
                <span>👛 Wallets</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
