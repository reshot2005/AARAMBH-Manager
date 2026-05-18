import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth, forbidden } from '@/lib/emp-auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const date = searchParams.get('date')
  const responsiblePersonId = searchParams.get('responsible_person_id')

  let query = supabaseAdmin.from('emp_accountability_log').select('*')

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (date) query = query.eq('due_date', date)
  if (responsiblePersonId) query = query.eq('responsible_person_id', responsiblePersonId)

  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { employee_id, responsible_person_id, responsible_type, task_description, status, due_date, covered_by } = body

  if (!employee_id || !responsible_type || !task_description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if updating an existing log for today
  const targetDate = due_date || new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabaseAdmin
    .from('emp_accountability_log')
    .select('id')
    .eq('employee_id', employee_id)
    .eq('responsible_type', responsible_type)
    .eq('due_date', targetDate)
    .single()

  let result
  if (existing) {
    result = await supabaseAdmin
      .from('emp_accountability_log')
      .update({
        status: status || 'pending',
        covered_by: covered_by || '',
        completed_at: status === 'completed' || status === 'covered_by_buddy' ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin
      .from('emp_accountability_log')
      .insert({
        employee_id,
        responsible_person_id,
        responsible_type,
        task_description,
        status: status || 'pending',
        due_date: targetDate,
        covered_by: covered_by || '',
        completed_at: status === 'completed' || status === 'covered_by_buddy' ? new Date().toISOString() : null,
      })
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
