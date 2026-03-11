'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Transaction {
  id: string
  amount: number
  category: string
  transaction_date: string
  roundup_amount: number
}

interface CategorySummary {
  name: string
  value: number
  percentage: number
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const supabase = createClient()

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch all transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: true })

        if (txData) {
          setTransactions(txData)

          // Calculate category breakdown
          const categoryMap: Record<string, number> = {}
          let total = 0

          txData.forEach((tx) => {
            categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount
            total += tx.amount
          })

          const categoryStats: CategorySummary[] = Object.entries(categoryMap)
            .map(([name, value]) => ({
              name,
              value: parseFloat(value.toFixed(2)),
              percentage: parseFloat(((value / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.value - a.value)

          setCategoryData(categoryStats)

          // Calculate monthly trend
          const monthMap: Record<string, { spent: number; saved: number }> = {}

          txData.forEach((tx) => {
            const date = new Date(tx.transaction_date)
            const monthKey = format(date, 'MMM yyyy')

            if (!monthMap[monthKey]) {
              monthMap[monthKey] = { spent: 0, saved: 0 }
            }

            monthMap[monthKey].spent += tx.amount
            monthMap[monthKey].saved += tx.roundup_amount
          })

          const monthlyStats = Object.entries(monthMap)
            .map(([month, data]) => ({
              month,
              spent: parseFloat(data.spent.toFixed(2)),
              saved: parseFloat(data.saved.toFixed(2)),
            }))
            .slice(-6) // Last 6 months

          setMonthlyData(monthlyStats)
        }
      } catch (error) {
        console.error('[v0] Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const totalSaved = transactions.reduce((sum, tx) => sum + tx.roundup_amount, 0)
  const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">Your spending patterns and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{transactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{totalSaved.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSpent > 0 ? ((totalSaved / totalSpent) * 100).toFixed(1) : 0}% of spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{avgTransaction.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalSpent > 0 ? ((totalSaved / totalSpent) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Automatic savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your top spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `₹${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {categoryData.map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{cat.value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Spending & Savings Trend</CardTitle>
            <CardDescription>Your spending and savings over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `₹${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Bar dataKey="spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Detailed view of all spending categories</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-2 font-medium">Category</th>
                    <th className="text-right py-3 px-2 font-medium">Amount</th>
                    <th className="text-right py-3 px-2 font-medium">Percentage</th>
                    <th className="text-right py-3 px-2 font-medium">Avg per Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat) => {
                    const catTransactions = transactions.filter((tx) => tx.category === cat.name)
                    const avgPerTx = catTransactions.length > 0 ? cat.value / catTransactions.length : 0

                    return (
                      <tr key={cat.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{cat.name}</td>
                        <td className="py-3 px-2 text-right font-medium">₹{cat.value.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right">
                          <span className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                            {cat.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">₹{avgPerTx.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
