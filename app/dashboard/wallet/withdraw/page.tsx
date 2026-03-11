'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PiggyBank, ArrowRight, Wallet, ArrowDownToLine, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-10 max-w-2xl mx-auto pb-20"
    >
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Unlock Savings</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Transfer funds from your Piggy Bank back to Spendable Balance.</p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2">
          <motion.div variants={cardVars}>
            <Card className="border-none shadow-xl bg-slate-900 rounded-[32px] overflow-hidden text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Savings</p>
                </div>
                <p className="text-2xl font-black tracking-tight text-white">₹{piggyBalance.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVars}>
            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[32px] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spendable</p>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900">₹{spendableBalance.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <ArrowDownToLine className="w-6 h-6 text-indigo-600" />
                Withdraw Capital
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium pt-1">
                Moving funds back to spendable does not count as spending, but reduces your saved assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleWithdraw} className="space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-end ml-1">
                    <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Withdrawal Amount (₹)</Label>
                    <button
                      type="button"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                      onClick={() => setAmount(String(piggyBalance))}
                    >
                      MAX (₹{piggyBalance.toFixed(2)})
                    </button>
                  </div>
                  <div className="relative group">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
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

                <AnimatePresence>
                  {parseFloat(amount) > 0 && parseFloat(amount) <= piggyBalance && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6 text-sm"
                    >
                      <div className="flex items-center justify-between font-black text-indigo-900 mb-4">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="w-5 h-5" /> ₹{parseFloat(amount).toFixed(2)}
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5" /> Wallet
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">New Piggy Balance</p>
                          <p className="font-black text-indigo-900">₹{(piggyBalance - parseFloat(amount)).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">New Spendable</p>
                          <p className="font-black text-indigo-900">₹{(spendableBalance + parseFloat(amount)).toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-black gap-3 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all transition-transform active:scale-[0.98]" 
                  disabled={loading || piggyBalance === 0}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-6 h-6" />
                      Withdraw to Spendable
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
