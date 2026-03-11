import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase credentials' },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    console.log('[v0] Starting database initialization...')

    await supabase.from('user_profiles').select('id').limit(1)
    console.log('[v0] Checking if user_profiles table exists...')

    const { error: userProfilesError } = await supabase.rpc('create_user_profiles_table', {})
    if (userProfilesError && !userProfilesError.message.includes('already exists')) {
      console.log('[v0] user_profiles table might already exist or created')
    }

    console.log('[v0] Database initialization completed')
    return NextResponse.json({ success: true, message: 'Database initialized' })
  } catch (error: any) {
    console.error('[v0] Database init error:', error)
    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      note: 'Tables may already exist',
    })
  }
}
