'use client'

import { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  PiggyBank, 
  LogOut, 
  Home, 
  TrendingUp, 
  Zap, 
  Lightbulb, 
  User as UserIcon, 
  Wallet,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function DashboardNav({ user }: { user: SupabaseUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Activity', icon: Activity, href: '/dashboard/transactions' },
    { label: 'Insights', icon: TrendingUp, href: '/dashboard/analytics' },
    { label: 'Progress', icon: Zap, href: '/dashboard/gamification' },
    { label: 'Profile', icon: UserIcon, href: '/dashboard/profile' },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-xl border-b border-slate-100">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <PiggyBank className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900">RoundUp</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`relative px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center gap-2 ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500 hover:bg-indigo-50/50'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute -bottom-[25px] left-0 right-0 h-1 bg-indigo-600 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</p>
            <p className="text-sm font-bold text-slate-900">{user.email?.split('@')[0]}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-10 px-4 rounded-xl border-none bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 font-bold gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
