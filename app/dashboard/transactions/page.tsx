'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  transaction_date: string
  roundup_amount: number
  created_at: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .limit(100)

          setTransactions(data || [])
        }
      } catch (error) {
        console.error('[v0] Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [supabase])

  const handleDelete = async (transactionId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Delete transaction
      await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', user.id)

      // Find the transaction to get roundup amount
      const transaction = transactions.find((t) => t.id === transactionId)
      if (!transaction) return

      // Update user balance
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_balance')
        .eq('id', user.id)
        .single()

      const newBalance = Math.max((profile?.current_balance || 0) - transaction.roundup_amount, 0)

      await supabase
        .from('user_profiles')
        .update({ current_balance: newBalance })
        .eq('id', user.id)

      // Update monthly stats
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const { data: stats } = await supabase
        .from('monthly_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single()

      if (stats) {
        await supabase
          .from('monthly_stats')
          .update({
            total_spent: Math.max((stats.total_spent || 0) - transaction.amount, 0),
            total_roundup: Math.max((stats.total_roundup || 0) - transaction.roundup_amount, 0),
            transaction_count: Math.max((stats.transaction_count || 0) - 1, 0),
          })
          .eq('id', stats.id)
      }

      // Remove from UI
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId))
    } catch (error) {
      console.error('[v0] Error deleting transaction:', error)
    }
  }

  const filteredTransactions = transactions.filter((t) =>
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-2">View and manage your expenses</p>
        </div>
        <Link href="/dashboard/transactions/add">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Total: {filteredTransactions.length} transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search by category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No transactions yet</p>
              <Link href="/dashboard/transactions/add">
                <Button>Add your first expense</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Category</th>
                    <th className="text-left py-3 px-2 font-medium">Description</th>
                    <th className="text-right py-3 px-2 font-medium">Amount</th>
                    <th className="text-right py-3 px-2 font-medium">Saved</th>
                    <th className="text-center py-3 px-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block bg-secondary px-2 py-1 rounded text-xs font-medium">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {transaction.description || '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        ₹{transaction.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-green-600">
                        {transaction.roundup_amount > 0 ? `₹${transaction.roundup_amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
