'use client'

import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PiggyBank, LogOut, Home, TrendingUp, Zap, Lightbulb, User } from 'lucide-react'

export default function DashboardNav({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <PiggyBank className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl">RoundUp</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <TrendingUp className="w-4 h-4" />
            Transactions
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </Link>
          <Link href="/dashboard/gamification" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <Zap className="w-4 h-4" />
            Progress
          </Link>
          <Link href="/dashboard/insights" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <Lightbulb className="w-4 h-4" />
            Insights
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-1 text-sm hover:text-foreground/80">
            <User className="w-4 h-4" />
            Profile
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm">
            <p className="font-medium">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
