import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  requireAuth,
  assertMethod,
  performedByLabel,
  logEmpAudit,
  forbidden,
  type AuthContext,
} from '@/lib/emp-auth-middleware'

async function assertEmployeeAccess(auth: AuthContext, employeeId: string): Promise<boolean> {
  if (auth.role === 'super_admin' || auth.role === 'admin') return true
  if (auth.role === 'employee') return auth.employeeId === employeeId
  if (auth.role === 'mentor' && auth.mentorId) {
    const { data } = await supabaseAdmin
      .from('emp_employees')
      .select('mentor_id')
      .eq('id', employeeId)
      .single()
    return data?.mentor_id === auth.mentorId
  }
  return false
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const denied = assertMethod(auth, 'GET', 'employees')
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const department = searchParams.get('department')
  const search = searchParams.get('search')
  const id = searchParams.get('id')

  if (auth.role === 'employee') {
    if (!auth.employeeId) return forbidden()
    const { data, error } = await supabaseAdmin
      .from('emp_employees')
      .select('*')
      .eq('id', auth.employeeId)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  let query = supabaseAdmin.from('emp_employees').select('*').order('created_at', { ascending: false })

  if (auth.role === 'mentor' && auth.mentorId) {
    query = query.eq('mentor_id', auth.mentorId)
  }

  if (id) {
    if (!(await assertEmployeeAccess(auth, id))) return forbidden()
    query = query.eq('id', id)
  }

  if (status) query = query.eq('status', status)
  if (department) query = query.eq('department', department)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const denied = assertMethod(auth, 'POST', 'employees')
  if (denied) return denied

  const body = await req.json()
  const loginEmail = String(body.login_email || body.loginEmail || '').trim().toLowerCase()
  const loginPassword = String(body.login_password || body.loginPassword || '')
  const by = performedByLabel(auth)

  if (!loginEmail || loginPassword.length < 6) {
    return NextResponse.json(
      { error: 'Login email and password (min 6 characters) are required' },
      { status: 400 }
    )
  }

  const insertRow: Record<string, unknown> = { ...body }
  delete insertRow.login_email
  delete insertRow.loginEmail
  delete insertRow.login_password
  delete insertRow.loginPassword

  if (auth.role === 'mentor' && auth.mentorId) {
    const { data: mentor } = await supabaseAdmin
      .from('emp_mentors')
      .select('name')
      .eq('id', auth.mentorId)
      .single()
    insertRow.mentor_id = auth.mentorId
    insertRow.mentor = mentor?.name || auth.name
    insertRow.status = insertRow.status || 'Pending'
  }

  const { data, error } = await supabaseAdmin
    .from('emp_employees')
    .insert(insertRow)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const isActive = data.status === 'Joined'
  const hashed = await bcrypt.hash(loginPassword, 10)
  const { error: authError } = await supabaseAdmin.from('emp_auth_users').insert({
    email: loginEmail,
    password: hashed,
    role: 'employee',
    linked_employee_id: data.id,
    is_active: isActive,
    created_at: new Date().toISOString(),
  })

  if (authError) {
    await supabaseAdmin.from('emp_employees').delete().eq('id', data.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  if (body.department_id) {
    const { count } = await supabaseAdmin
      .from('emp_employees')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', body.department_id)
    await supabaseAdmin
      .from('emp_departments')
      .update({ employee_count: count || 0 })
      .eq('id', body.department_id)
  }

  await logEmpAudit('created', 'employee', data.id, `New employee ${data.name} added`, by)

  await supabaseAdmin.from('emp_notifications').insert({
    type: 'onboarding',
    title: 'New Employee Added',
    message: `${data.name} has been added as ${data.role || 'Employee'}`,
    action_url: '/dashboard/users',
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const by = performedByLabel(auth)

  if (auth.role === 'admin') {
    const denied = assertMethod(auth, 'PUT', 'employees')
    if (denied) return denied
    const allowedKeys = ['status', 'follow_up_comment']
    const filtered: Record<string, unknown> = {}
    for (const key of allowedKeys) {
      if (key in updates) filtered[key] = updates[key]
    }
    if (Object.keys(filtered).length === 0) {
      return forbidden('Admin can only update approval status')
    }

    const { data, error } = await supabaseAdmin
      .from('emp_employees')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (filtered.status === 'Joined') {
      await supabaseAdmin
        .from('emp_auth_users')
        .update({ is_active: true })
        .eq('linked_employee_id', id)
    }

    await logEmpAudit('updated', 'employee', id, `Employee ${data.name} status updated`, by)
    return NextResponse.json(data)
  }

  const denied = assertMethod(auth, 'PUT', 'employees')
  if (denied) return denied

  if (auth.role === 'mentor') {
    if (!(await assertEmployeeAccess(auth, id))) return forbidden()
    delete updates.mentor_id
    delete updates.mentor
  }

  if (auth.role === 'employee') return forbidden()

  const { data, error } = await supabaseAdmin
    .from('emp_employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.status === 'Joined') {
    await supabaseAdmin
      .from('emp_auth_users')
      .update({ is_active: true })
      .eq('linked_employee_id', id)
  }

  await logEmpAudit('updated', 'employee', id, `Employee ${data.name} updated`, by)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const denied = assertMethod(auth, 'DELETE', 'employees')
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const by = performedByLabel(auth)

  const { data: emp } = await supabaseAdmin
    .from('emp_employees')
    .select('name,department_id')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin.from('emp_employees').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('emp_auth_users').delete().eq('linked_employee_id', id)

  if (emp?.department_id) {
    const { count } = await supabaseAdmin
      .from('emp_employees')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', emp.department_id)
    await supabaseAdmin
      .from('emp_departments')
      .update({ employee_count: count || 0 })
      .eq('id', emp.department_id)
  }

  await logEmpAudit('deleted', 'employee', id, `Employee ${emp?.name || 'Unknown'} removed`, by)
  return NextResponse.json({ success: true })
}
