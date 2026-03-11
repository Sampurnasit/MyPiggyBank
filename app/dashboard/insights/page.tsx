'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  category: string
  transaction_date: string
  roundup_amount: number
}

interface PersonalityProfile {
  type: string
  emoji: string
  description: string
  traits: string[]
  strengths: string[]
  improvements: string[]
}

const PERSONALITIES: Record<string, PersonalityProfile> = {
  lion: {
    type: 'Lion',
    emoji: '🦁',
    description: 'The Fearless Spender',
    traits: ['Confident', 'Adventurous', 'Social', 'Generous'],
    strengths: ['Quick decision maker', 'Enjoys life', 'Generous with friends'],
    improvements: ['Budget more carefully', 'Plan major purchases', 'Save for unexpected expenses'],
  },
  bee: {
    type: 'Bee',
    emoji: '🐝',
    description: 'The Busy Achiever',
    traits: ['Hardworking', 'Goal-oriented', 'Active', 'Practical'],
    strengths: ['Earns well', 'Focused on goals', 'Efficient with time'],
    improvements: ['Take more breaks', 'Enjoy small pleasures', 'Invest in wellness'],
  },
  fox: {
    type: 'Fox',
    emoji: '🦊',
    description: 'The Smart Saver',
    traits: ['Clever', 'Strategic', 'Cautious', 'Analytical'],
    strengths: ['Great at finding deals', 'Long-term planning', 'Risk-aware'],
    improvements: ['Be more spontaneous', 'Enjoy rewards', 'Invest in experiences'],
  },
  turtle: {
    type: 'Turtle',
    emoji: '🐢',
    description: 'The Steady Saver',
    traits: ['Patient', 'Reliable', 'Thoughtful', 'Conservative'],
    strengths: ['Consistent saver', 'Low risk', 'Disciplined'],
    improvements: ['Explore new experiences', 'Take calculated risks', 'Enjoy your savings'],
  },
  butterfly: {
    type: 'Butterfly',
    emoji: '🦋',
    description: 'The Spontaneous Optimizer',
    traits: ['Flexible', 'Creative', 'Fun-loving', 'Impulsive'],
    strengths: ['Adapts quickly', 'Enjoys variety', 'Creative problem solver'],
    improvements: ['Plan ahead more', 'Track spending', 'Set clear goals'],
  },
  eagle: {
    type: 'Eagle',
    emoji: '🦅',
    description: 'The Vision Planner',
    traits: ['Strategic', 'Visionary', 'Ambitious', 'Independent'],
    strengths: ['Big picture thinker', 'Self-reliant', 'Growth-focused'],
    improvements: ['Balance vision with present', 'Celebrate small wins', 'Build support network'],
  },
}

const ROASTS = [
  "You're spending like your salary is infinite. Newsflash: it isn't! 😄",
  "Saving ₹{saved} from ₹{spent} spent? That's the spirit! Keep it up! 🚀",
  "Your piggy bank is getting chubby. Those roundups are adding up! 🐷",
  "Coffee? More like 'Coffee and Another Coffee' amirite? ☕☕",
  "You're basically keeping the delivery apps in business. Thanks for your service! 🚗",
  "That shopping spree though! Your wardrobe called—it's overwhelmed. 👗",
  "You save ₹{savings_percent}% of your spending. Better than doing nothing! 💪",
  "Entertainment spending is real. At least you're having fun while you're broke! 🎬",
  "Your roundup savings could buy {coffee_count} coffees! Or 1 fancy lunch. 🍕",
  "Consistent spender. I respect the predictability. Very organized chaos! 📊",
]

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null)
  const [roast, setRoast] = useState('')
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalSaved: 0,
    topCategory: '',
    savingsPercent: 0,
    avgTransaction: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })

        if (!txData) {
          setLoading(false)
          return
        }

        setTransactions(txData)

        // Calculate statistics
        const totalSpent = txData.reduce((sum, tx) => sum + tx.amount, 0)
        const totalSaved = txData.reduce((sum, tx) => sum + tx.roundup_amount, 0)

        const categoryMap: Record<string, number> = {}
        txData.forEach((tx) => {
          categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount
        })

        const topCategory = Object.keys(categoryMap).reduce((a, b) =>
          categoryMap[a] > categoryMap[b] ? a : b
        )

        const savingsPercent = totalSpent > 0 ? (totalSaved / totalSpent) * 100 : 0
        const avgTransaction = txData.length > 0 ? totalSpent / txData.length : 0

        setStats({
          totalSpent,
          totalSaved,
          topCategory,
          savingsPercent: Math.round(savingsPercent),
          avgTransaction,
        })

        // Determine personality
        detectPersonality(categoryMap, totalSpent, totalSaved, txData.length)

        // Generate roast
        generateRoast(totalSpent, totalSaved, savingsPercent, topCategory)
      } catch (error) {
        console.error('[v0] Error loading insights:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [supabase])

  const detectPersonality = (
    categoryMap: Record<string, number>,
    totalSpent: number,
    totalSaved: number,
    transactionCount: number
  ) => {
    const topCategory = Object.keys(categoryMap).reduce((a, b) =>
      categoryMap[a] > categoryMap[b] ? a : b
    )
    const savingsPercent = totalSpent > 0 ? (totalSaved / totalSpent) * 100 : 0
    const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0

    let personalityType = 'fox' // default

    // Simple personality detection based on spending patterns
    if (categoryMap['Entertainment'] > totalSpent * 0.25) {
      personalityType = 'lion' // High entertainment spending
    } else if (categoryMap['Food & Dining'] > totalSpent * 0.3) {
      personalityType = 'butterfly' // Spontaneous eater
    } else if (savingsPercent > 30) {
      personalityType = 'turtle' // High savings rate
    } else if (categoryMap['Shopping'] > totalSpent * 0.2) {
      personalityType = 'butterfly' // Fashion conscious
    } else if (categoryMap['Subscriptions'] > totalSpent * 0.1) {
      personalityType = 'bee' // Goal oriented with subscriptions
    } else if (avgTransaction > 2000) {
      personalityType = 'eagle' // Big spender, big vision
    }

    setPersonality(PERSONALITIES[personalityType])
  }

  const generateRoast = (
    totalSpent: number,
    totalSaved: number,
    savingsPercent: number,
    topCategory: string
  ) => {
    let selectedRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)]

    // Replace placeholders
    selectedRoast = selectedRoast.replace('{spent}', totalSpent.toFixed(0))
    selectedRoast = selectedRoast.replace('{saved}', totalSaved.toFixed(0))
    selectedRoast = selectedRoast.replace('{savings_percent}', Math.round(savingsPercent).toString())
    selectedRoast = selectedRoast.replace('{coffee_count}', Math.round(totalSaved / 150).toString())

    setRoast(selectedRoast)
  }

  const refreshRoast = () => {
    if (stats.totalSpent > 0) {
      generateRoast(stats.totalSpent, stats.totalSaved, stats.savingsPercent, stats.topCategory)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading your insights...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold mb-4">No transactions yet</p>
        <p className="text-muted-foreground mb-6">Add some expenses to see your spending insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Spending Insights</h1>
        <p className="text-muted-foreground mt-2">Discover your spending personality and get personalized insights</p>
      </div>

      {/* Personality Card */}
      {personality && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">
                  {personality.emoji} {personality.type}
                </CardTitle>
                <CardDescription className="text-base">{personality.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-semibold mb-2">Your Traits</p>
              <div className="flex flex-wrap gap-2">
                {personality.traits.map((trait) => (
                  <span key={trait} className="bg-white px-3 py-1 rounded-full text-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">Your Strengths</p>
                <ul className="space-y-1 text-sm">
                  {personality.strengths.map((strength) => (
                    <li key={strength} className="text-green-600">
                      ✓ {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-blue-700 mb-2">Areas to Improve</p>
                <ul className="space-y-1 text-sm">
                  {personality.improvements.map((improvement) => (
                    <li key={improvement} className="text-blue-600">
                      → {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Roast */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Daily Roast</CardTitle>
            <Button size="sm" variant="outline" onClick={refreshRoast} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              New Roast
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg italic text-gray-700">"{roast}"</p>
          <p className="text-xs text-muted-foreground mt-4">
            Fresh insight generated based on your spending patterns
          </p>
        </CardContent>
      </Card>

      {/* Spending Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{stats.totalSpent.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{transactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{stats.avgTransaction.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.savingsPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">Of your spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Category */}
      <Card>
        <CardHeader>
          <CardTitle>Your Top Spending Category</CardTitle>
          <CardDescription>Where most of your money goes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold capitalize">{stats.topCategory}</p>
            <p className="text-sm text-muted-foreground">
              {((transactions
                .filter((t) => t.category === stats.topCategory)
                .reduce((sum, t) => sum + t.amount, 0) /
                stats.totalSpent) *
                100).toFixed(1)}
              % of your total spending
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.savingsPercent < 10 && (
            <p className="text-sm">
              💡 Your savings rate is below 10%. Try rounding up to the nearest 100 for faster savings growth!
            </p>
          )}
          {transactions.length > 20 && (
            <p className="text-sm">
              💡 You're logging transactions consistently! Keep it up for better insights.
            </p>
          )}
          {stats.topCategory === 'Food & Dining' && (
            <p className="text-sm">
              💡 Food spending is high. Try meal planning to reduce both spending and waste!
            </p>
          )}
          {stats.topCategory === 'Entertainment' && (
            <p className="text-sm">
              💡 Entertainment is fun, but consider setting a monthly budget to balance fun and savings.
            </p>
          )}
          {stats.topCategory === 'Shopping' && (
            <p className="text-sm">
              💡 Shopping is great, but try the 24-hour rule before making purchases!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
