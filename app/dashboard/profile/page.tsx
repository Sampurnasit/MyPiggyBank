'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  PiggyBank, 
  Star, 
  TrendingUp, 
  Award, 
  Edit2, 
  Save, 
  X, 
  User, 
  Calendar, 
  ShieldCheck,
  Zap,
  Sparkles,
  Wallet,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  spendable_balance: number
  piggy_bank_balance: number
  total_saved: number
  xp_points: number
  level: number
  spending_personality: string
  created_at: string
}

const LEVEL_NAMES = ['', 'Saver Seedling', 'Budget Bud', 'Thrift Titan', 'Penny Pro', 'Round Up Ranger', 'Savings Legend']
const LEVEL_COLORS = [
  '', 
  'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200', 
  'bg-violet-50 text-violet-700 ring-1 ring-violet-200', 
  'bg-purple-50 text-purple-700 ring-1 ring-purple-200', 
  'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200', 
  'bg-pink-50 text-pink-700 ring-1 ring-pink-200', 
  'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ username: '', full_name: '' })
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({ username: data.username || '', full_name: data.full_name || '' })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ username: form.username.trim(), full_name: form.full_name.trim() || null })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setProfile(prev => prev ? { ...prev, username: form.username.trim(), full_name: form.full_name.trim() || null } : prev)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  const xpForNextLevel = profile ? profile.level * 500 : 500
  const xpProgress = profile ? Math.min((profile.xp_points % 500) / 500 * 100, 100) : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Accessing User Files...</p>
      </div>
    )
  }

  if (!profile) return null

  const levelName = LEVEL_NAMES[profile.level] || `Level ${profile.level}`
  const levelColor = LEVEL_COLORS[profile.level] || 'bg-slate-100 text-slate-800'

  if (!mounted) return null

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-10 pb-20"
    >
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Account</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Manage your profile and track your growth.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {!editing ? (
            <Button 
              variant="outline" 
              onClick={() => setEditing(true)} 
              className="h-12 px-6 rounded-2xl bg-white/50 border-none shadow-sm ring-1 ring-slate-200 hover:ring-indigo-500/20 font-bold gap-2 flex-1 md:flex-none"
            >
              <Edit2 className="w-4 h-4 text-indigo-600" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 flex-1 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Syncing...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setEditing(false); setForm({ username: profile.username, full_name: profile.full_name || '' }) }} 
                className="h-12 px-6 rounded-2xl bg-white border-none shadow-sm ring-1 ring-slate-200 font-bold gap-2 flex-1"
              >
                <X className="w-4 h-4 text-slate-400" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 text-indigo-800 text-sm font-bold flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Profile updated successfully!
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm font-bold flex items-center gap-3"
          >
            <X className="w-5 h-5 text-red-500" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div variants={cardVars} className="lg:col-span-2">
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black">Personal Data</CardTitle>
              <CardDescription>Your identifiable account information</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[32px] bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-600 shadow-inner group">
                  <span className="group-hover:scale-110 transition-transform">{profile.username?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-slate-900 leading-tight">{profile.username}</p>
                  {profile.full_name && <p className="text-lg font-bold text-slate-400">{profile.full_name}</p>}
                  <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-widest pt-2">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {editing && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 pt-6"
                >
                  <Separator className="bg-slate-100" />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Username</Label>
                      <Input
                        id="username"
                        value={form.username}
                        onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                        className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Full Name</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                        className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Level Card */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-slate-900 rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" /> Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6 flex flex-col justify-between h-[calc(100%-80px)]">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-black text-white tracking-tighter">{profile.level}</div>
                  <Badge variant="secondary" className={`${levelColor} border-none rounded-xl px-4 py-2 font-black uppercase tracking-widest text-[10px]`}>
                    {levelName}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>{profile.xp_points} XP</span>
                    <span>{xpForNextLevel} Next</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-indigo-500 h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 italic">
                    {xpForNextLevel - (profile.xp_points % 500)} XP to reach next milestone
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-white/5 rounded-[24px] border border-white/5">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <p className="text-xs font-bold text-slate-300">You're in the top 15% of savers this month!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balances Card */}
        <motion.div variants={cardVars}>
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden h-full">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" /> Capital Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Total Piggy Balance</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">₹{profile.piggy_bank_balance.toFixed(2)}</p>
              </div>
              <Separator className="bg-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Spendable</p>
                  <p className="text-sm font-black text-indigo-600">₹{profile.spendable_balance.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Lifetime</p>
                  <p className="text-sm font-black text-slate-900">₹{profile.total_saved.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personality Card */}
        <motion.div variants={cardVars} className="lg:col-span-2">
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-slate-100 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Wealth Behavioral Profile
              </CardTitle>
              <CardDescription>Based on algorithmic transaction analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              {profile.spending_personality && profile.spending_personality !== 'unknown' ? (
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                    <Zap className="w-10 h-10 text-white fill-current" />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-2xl font-black text-slate-900 capitalize tracking-tight">{profile.spending_personality}</p>
                    <p className="text-slate-500 font-medium max-w-md">Your spending reflects a sophisticated pattern of financial consciousness. Keep recording interactions to refine your behavioral insights.</p>
                  </div>
                  <div className="ml-auto hidden md:block">
                     <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-black text-indigo-600">88%</span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <Activity className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-400 font-bold max-w-xs">Record at least 5 transactions to generate your behavioral profile.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
