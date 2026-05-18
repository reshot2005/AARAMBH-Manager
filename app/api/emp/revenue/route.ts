import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth, forbidden } from '@/lib/emp-auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let query = supabaseAdmin.from('emp_revenue_entries').select('*')

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', year)

  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  if (auth.role !== 'super_admin') {
    return forbidden('Only super admins can modify revenue entries')
  }

  const body = await req.json()
  const { employee_id, month, year, direct_revenue, indirect_revenue, rate_per_unit, units_delivered, notes } = body

  if (!employee_id || !month || !year) {
    return NextResponse.json({ error: 'employee_id, month, and year are required' }, { status: 400 })
  }

  // Upsert pattern
  const { data: existing } = await supabaseAdmin
    .from('emp_revenue_entries')
    .select('id')
    .eq('employee_id', employee_id)
    .eq('month', month)
    .eq('year', year)
    .single()

  let result
  if (existing) {
    result = await supabaseAdmin
      .from('emp_revenue_entries')
      .update({
        direct_revenue,
        indirect_revenue,
        rate_per_unit,
        units_delivered,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin
      .from('emp_revenue_entries')
      .insert({
        employee_id,
        month,
        year,
        direct_revenue,
        indirect_revenue,
        rate_per_unit,
        units_delivered,
        notes
      })
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
