import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { CREATE_TABLES_SQL } from '@/lib/setup-tables'

export async function POST() {
  try {
    // Split SQL into individual statements and execute them
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    const results: { statement: string; success: boolean; error?: string }[] = []

    for (const stmt of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: stmt + ';' }).maybeSingle()
      if (error) {
        // Try direct query as fallback
        const { error: err2 } = await supabaseAdmin.from('_exec').select().limit(0)
        results.push({
          statement: stmt.substring(0, 80) + '...',
          success: !error,
          error: error?.message
        })
      } else {
        results.push({ statement: stmt.substring(0, 80) + '...', success: true })
      }
    }

    return NextResponse.json({
      message: 'Setup attempted. Please run the SQL directly in Supabase SQL Editor for best results.',
      results
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
