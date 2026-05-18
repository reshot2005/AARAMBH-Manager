import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let query = supabaseAdmin.from('emp_payroll').select('*, emp_employees(name, role, department)').order('created_at', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', parseInt(year))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Calculate net salary
  const gross = (body.basic_salary || 0) + (body.hra || 0) + (body.da || 0) + (body.ta || 0) + (body.bonus || 0)
  const totalDeductions = (body.deductions || 0) + (body.pf || 0) + (body.tax || 0)
  body.net_salary = gross - totalDeductions

  const { data, error } = await supabaseAdmin.from('emp_payroll').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('emp_notifications').insert({
    type: 'payroll', title: 'Payroll Entry Created',
    message: `Payroll for ${body.month} ${body.year} processed`,
    action_url: '/dashboard/payroll',
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (updates.basic_salary !== undefined) {
    const gross = (updates.basic_salary || 0) + (updates.hra || 0) + (updates.da || 0) + (updates.ta || 0) + (updates.bonus || 0)
    const totalDeductions = (updates.deductions || 0) + (updates.pf || 0) + (updates.tax || 0)
    updates.net_salary = gross - totalDeductions
  }

  const { data, error } = await supabaseAdmin.from('emp_payroll').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('emp_payroll').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
