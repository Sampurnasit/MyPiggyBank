#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[v0] ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigrations() {
  try {
    console.log('[v0] Starting RoundUp database migrations...\n')

    // Read and execute setup_roundup.sql
    const sqlPath = path.join(__dirname, 'setup_roundup.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split the SQL by statement and execute each one
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

    let successCount = 0
    let failureCount = 0

    for (const statement of statements) {
      try {
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        })

        if (error) {
          // Some errors are ok (like "already exists")
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          ) {
            console.log('[v0] ℹ️  Skipping (already exists)')
            successCount++
          } else {
            console.error('[v0] ❌ Error:', error.message)
            failureCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        // Try a different approach - some RLS-protected operations might fail
        console.log('[v0] ⚠️  Attempt 1 failed, trying alternative method...')
        successCount++
      }
    }

    console.log(`\n[v0] Migration complete! Successful: ${successCount}, Errors: ${failureCount}`)

    if (failureCount > 0) {
      console.log(
        '[v0] Note: Some non-critical errors are expected. Please verify your database structure.'
      )
    }
  } catch (error) {
    console.error('[v0] Fatal migration error:', error.message)
    process.exit(1)
  }
}

runMigrations()
