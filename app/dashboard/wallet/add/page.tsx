'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, IndianRupee, CreditCard, Shield, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000]

declare global {
  interface Window {
    Razorpay: any
  }
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

export default function AddMoneyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
      if (script.parentNode) script.parentNode.removeChild(script)
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
        theme: { color: '#6366f1' },
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

  if (!mounted) return null

  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-10 max-w-2xl mx-auto pb-20"
    >
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Add Money</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Instantly fuel your spendable wallet via secure gateway.</p>
      </div>

      <div className="space-y-6">
        {balance !== null && (
          <motion.div variants={cardVars}>
            <Card className="border-none shadow-xl bg-indigo-600 rounded-[32px] overflow-hidden text-white relative">
              <CardContent className="p-8 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Available to Spend</p>
                  <p className="text-4xl font-black tracking-tight">₹{balance.toFixed(2)}</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
              </CardContent>
              <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
            </Card>
          </motion.div>
        )}

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <IndianRupee className="w-6 h-6 text-indigo-600" />
                Capitalize Wallet
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium pt-1">
                Supported via UPI, Cards, and Netbanking. Secured by industry-grade encryption.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handlePayment} className="space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Deposit Amount (₹)</Label>
                  <div className="relative group">
                    <Input
                      id="amount"
                      type="number"
                      step="1"
                      min="1"
                      placeholder="0.00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-16 bg-slate-50 border-none rounded-[24px] px-8 text-2xl font-black focus-visible:ring-4 focus-visible:ring-indigo-500/10 transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      INR
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instant Presets</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="ghost"
                        onClick={() => setAmount(String(amt))}
                        className={`h-11 px-6 rounded-xl font-bold transition-all ${amount === String(amt) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-800">100% Secure Transaction via Razorpay</span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 text-lg font-black gap-3 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all transition-transform active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      Proceed to Pay ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
                    </>
                  )}
                </Button>

                <div className="flex justify-center items-center gap-4 py-2 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest">VISA</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">MASTERCARD</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">UPI</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">RuPay</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
