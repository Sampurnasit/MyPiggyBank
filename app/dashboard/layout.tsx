import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import DashboardNav from '@/components/dashboard-nav'

export const metadata = {
  title: 'Dashboard - RoundUp',
  description: 'Track and save with RoundUp',
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <div className="container mx-auto py-8">{children}</div>
    </div>
  )
}
