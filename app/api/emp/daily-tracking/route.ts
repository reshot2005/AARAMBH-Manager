import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth, forbidden } from '@/lib/emp-auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const date = searchParams.get('date')

  let query = supabaseAdmin.from('emp_performance_daily').select('*')

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { employee_id, date, score, tasks_assigned, tasks_completed, rating, remarks, revenue_impact, revenue_amount, trajectory } = body

  if (!employee_id || !date) {
    return NextResponse.json({ error: 'employee_id and date are required' }, { status: 400 })
  }

  // Check if locked
  const { data: existing } = await supabaseAdmin
    .from('emp_performance_daily')
    .select('id, is_locked')
    .eq('employee_id', employee_id)
    .eq('date', date)
    .single()

  if (existing?.is_locked && auth.role !== 'super_admin') {
    return forbidden('This record is locked and cannot be edited')
  }

  // Also enforce past date locking rule
  const targetDateObj = new Date(date)
  const todayObj = new Date(new Date().toISOString().split('T')[0])
  if (targetDateObj < todayObj && auth.role !== 'super_admin') {
    return forbidden('Past dates are locked for editing')
  }

  let result
  if (existing) {
    result = await supabaseAdmin
      .from('emp_performance_daily')
      .update({
        score,
        tasks_assigned,
        tasks_completed,
        rating,
        remarks,
        revenue_impact,
        revenue_amount,
        trajectory,
        submitted_by: auth.name || auth.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin
      .from('emp_performance_daily')
      .insert({
        employee_id,
        date,
        score,
        tasks_assigned,
        tasks_completed,
        rating,
        remarks,
        revenue_impact,
        revenue_amount,
        trajectory,
        submitted_by: auth.name || auth.email,
        is_locked: false
      })
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  
  // Implicitly log accountability task for the mentor if this was submitted by them
  if (auth.role === 'mentor' && auth.mentorId) {
    const { data: logEntry } = await supabaseAdmin
      .from('emp_accountability_log')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('due_date', date)
      .eq('responsible_type', 'mentor')
      .single()
      
    if (logEntry) {
      await supabaseAdmin.from('emp_accountability_log').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', logEntry.id)
    } else {
      await supabaseAdmin.from('emp_accountability_log').insert({
        employee_id,
        responsible_person_id: auth.mentorId,
        responsible_type: 'mentor',
        task_description: 'Daily Performance Rating',
        status: 'completed',
        due_date: date,
        completed_at: new Date().toISOString()
      })
    }
  }

  return NextResponse.json(result.data)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  if (auth.role !== 'super_admin') {
    return forbidden('Only super admins can lock/unlock records')
  }

  const body = await req.json()
  const { employee_id, date, is_locked } = body

  if (!employee_id || !date || typeof is_locked !== 'boolean') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('emp_performance_daily')
    .update({ is_locked })
    .eq('employee_id', employee_id)
    .eq('date', date)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
