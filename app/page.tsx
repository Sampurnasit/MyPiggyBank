import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PiggyBank, TrendingUp, Zap, Gift } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <PiggyBank className="w-8 h-8 text-orange-600" />
            <span className="font-bold text-2xl">RoundUp</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Save Money Without Thinking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            RoundUp turns your everyday spending into automatic savings. Every transaction gets
            rounded up, and the difference goes straight to your piggy bank. No effort required.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg h-12">
              Get Started Free
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg h-12">
            Learn More
          </Button>
        </div>

        {/* Features Preview */}
        <div className="mt-20">
          <div className="inline-block bg-white/50 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-8">
            ✨ Designed for Indian Gen Z
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <PiggyBank className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Smart Roundups</h3>
              <p className="text-gray-600">
                Round each transaction to the nearest 10, 100, or 1000 and watch savings grow
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <Zap className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Gamified Progress</h3>
              <p className="text-gray-600">
                Earn XP, unlock levels, and collect badges as you build your savings habits
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Understand your spending patterns and get personalized insights daily
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-4xl font-bold text-orange-600">₹0</p>
            <p className="text-gray-600">Setup cost</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-orange-600">100%</p>
            <p className="text-gray-600">Your money stays yours</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-orange-600">Instant</p>
            <p className="text-gray-600">Start saving today</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-white/50 backdrop-blur border-t">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start saving?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join the RoundUp community and transform your spending into savings. No credit card
            required.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg h-12">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
