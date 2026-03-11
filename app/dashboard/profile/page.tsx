'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PiggyBank, Star, TrendingUp, Award, Edit2, Save, X } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  current_balance: number
  total_saved: number
  xp_points: number
  level: number
  spending_personality: string
  created_at: string
}

const LEVEL_NAMES = ['', 'Saver Seedling', 'Budget Bud', 'Thrift Titan', 'Penny Pro', 'Round Up Ranger', 'Savings Legend']
const LEVEL_COLORS = ['', 'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800', 'bg-yellow-100 text-yellow-800']

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ username: '', full_name: '' })
  const supabase = createClient()

  useEffect(() => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    )
  }

  const levelName = LEVEL_NAMES[profile.level] || `Level ${profile.level}`
  const levelColor = LEVEL_COLORS[profile.level] || 'bg-gray-100 text-gray-800'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Track your savings journey</p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setForm({ username: profile.username, full_name: profile.full_name || '' }) }} className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-800 text-sm">
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.username}</p>
              {profile.full_name && <p className="text-muted-foreground">{profile.full_name}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {editing && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="your_username"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Piggy Bank Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">₹{profile.current_balance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total ever saved: ₹{profile.total_saved.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Level & XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold">{profile.level}</p>
              <Badge className={levelColor}>{levelName}</Badge>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{profile.xp_points} XP</span>
                <span>{xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {xpForNextLevel - (profile.xp_points % 500)} XP to next level
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Personality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Spending Personality
          </CardTitle>
          <CardDescription>Based on your transaction patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.spending_personality && profile.spending_personality !== 'unknown' ? (
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <p className="text-lg font-semibold capitalize">{profile.spending_personality}</p>
                <p className="text-sm text-muted-foreground">Keep adding transactions to refine your profile</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Add more transactions to discover your spending personality.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
