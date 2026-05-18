import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createSessionToken, EMP_SESSION_COOKIE } from '@/lib/emp-session'
import { logEmpAudit } from '@/lib/emp-auth-middleware'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const superEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const superPassword = process.env.SUPER_ADMIN_PASSWORD
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD

  let sessionPayload: {
    role: 'super_admin' | 'admin' | 'mentor' | 'employee'
    email: string
    name: string
    mentorId?: string
    employeeId?: string
  } | null = null
  let performedBy = ''

  if (superEmail && superPassword && email === superEmail && password === superPassword) {
    sessionPayload = { role: 'super_admin', email, name: 'Super Admin' }
    performedBy = 'Super Admin'
  } else if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    sessionPayload = { role: 'admin', email, name: 'Admin' }
    performedBy = 'Admin'
  } else {
    const { data: authUser, error } = await supabaseAdmin
      .from('emp_auth_users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error || !authUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!authUser.is_active) {
      return NextResponse.json(
        { error: 'Account is not active. Please wait for administrator approval.' },
        { status: 403 }
      )
    }

    const valid = await bcrypt.compare(password, authUser.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (authUser.role === 'mentor' && authUser.linked_mentor_id) {
      const { data: mentor } = await supabaseAdmin
        .from('emp_mentors')
        .select('id, name, is_active')
        .eq('id', authUser.linked_mentor_id)
        .single()

      if (!mentor?.is_active) {
        return NextResponse.json({ error: 'Mentor account is inactive' }, { status: 403 })
      }

      sessionPayload = {
        role: 'mentor',
        email,
        name: mentor.name,
        mentorId: mentor.id,
      }
      performedBy = `Mentor: ${mentor.name}`

      await supabaseAdmin
        .from('emp_auth_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id)
    } else if (authUser.role === 'employee' && authUser.linked_employee_id) {
      const { data: employee } = await supabaseAdmin
        .from('emp_employees')
        .select('id, name, status')
        .eq('id', authUser.linked_employee_id)
        .single()

      if (!employee || employee.status !== 'Joined') {
        return NextResponse.json(
          { error: 'Employee account is not yet approved for login.' },
          { status: 403 }
        )
      }

      sessionPayload = {
        role: 'employee',
        email,
        name: employee.name,
        employeeId: employee.id,
      }
      performedBy = employee.name

      await supabaseAdmin
        .from('emp_auth_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id)
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  }

  const token = await createSessionToken(sessionPayload)
  await logEmpAudit('login', 'auth', null, `${sessionPayload.name} logged in`, performedBy)

  const res = NextResponse.json({
    role: sessionPayload.role,
    name: sessionPayload.name,
    email: sessionPayload.email,
    mentorId: sessionPayload.mentorId,
    employeeId: sessionPayload.employeeId,
  })

  res.cookies.set(EMP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return res
}
