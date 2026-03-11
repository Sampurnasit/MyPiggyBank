import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      roundup_amount,
      expense_amount,
      category,
      description,
    } = await request.json()

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Payment verified — log transaction and update piggy bank
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: expense_amount,
      category,
      description: description || null,
      roundup_amount: roundup_amount,
      source: 'manual',
    })

    if (txError) {
      return NextResponse.json({ error: 'Failed to log transaction' }, { status: 500 })
    }

    // Update piggy bank balance (roundup was paid via Razorpay, so it goes directly to piggy bank)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('piggy_bank_balance, total_saved')
      .eq('id', user.id)
      .single()

    const newPiggy = (profile?.piggy_bank_balance || 0) + roundup_amount
    const newTotalSaved = (profile?.total_saved || 0) + roundup_amount

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        piggy_bank_balance: newPiggy,
        total_saved: newTotalSaved,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

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
          total_spent: (stats.total_spent || 0) + expense_amount,
          total_roundup: (stats.total_roundup || 0) + roundup_amount,
          transaction_count: (stats.transaction_count || 0) + 1,
          avg_transaction: ((stats.total_spent || 0) + expense_amount) / ((stats.transaction_count || 0) + 1),
        })
        .eq('id', stats.id)
    } else {
      await supabase.from('monthly_stats').insert({
        user_id: user.id,
        month_year: monthYear,
        total_spent: expense_amount,
        total_roundup: roundup_amount,
        transaction_count: 1,
        avg_transaction: expense_amount,
      })
    }

    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      piggy_bank_balance: newPiggy,
    })
  } catch (error) {
    console.error('Roundup verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
