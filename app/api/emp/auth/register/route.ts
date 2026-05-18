import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-server'
import { logEmpAudit } from '@/lib/emp-auth-middleware'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const phone = String(body.phone || '').trim()
  const password = String(body.password || '')
  const confirmPassword = String(body.confirmPassword || body.confirm_password || '')
  const department = String(body.department || '').trim()
  const role = String(body.role || body.designation || '').trim()
  const photo = String(body.photo || '').trim()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  const { data: existingAuth } = await supabaseAdmin
    .from('emp_auth_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingAuth) {
    return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
  }

  const { data: existingReg } = await supabaseAdmin
    .from('emp_mentor_registrations')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existingReg && existingReg.status === 'Pending') {
    return NextResponse.json({ error: 'A registration with this email is already pending' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('emp_mentor_registrations')
    .insert({
      name,
      email,
      phone,
      password: hashed,
      department,
      role,
      photo,
      status: 'Pending',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin.from('emp_notifications').insert({
    type: 'approval',
    title: 'New mentor registration',
    message: `New mentor registration: ${name} is awaiting approval`,
    action_url: '/dashboard/mentor-registrations',
  })

  await logEmpAudit(
    'registered',
    'mentor_registration',
    data.id,
    `Mentor registration submitted by ${name}`,
    name
  )

  return NextResponse.json({
    success: true,
    message:
      'Registration submitted successfully. You will be able to login once approved by an administrator.',
  })
}
