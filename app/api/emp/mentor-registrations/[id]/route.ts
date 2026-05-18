import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  requireAuth,
  assertMethod,
  performedByLabel,
  logEmpAudit,
} from '@/lib/emp-auth-middleware'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const denied = assertMethod(auth, 'PUT', 'mentor-registrations')
  if (denied) return denied

  if (auth.role !== 'super_admin' && auth.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action || '')
  const rejectionReason = String(body.rejectionReason || body.rejection_reason || '')
  const id = params.id
  const by = performedByLabel(auth)
  const now = new Date().toISOString()

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from('emp_mentor_registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  if (registration.status !== 'Pending') {
    return NextResponse.json({ error: 'Registration already reviewed' }, { status: 400 })
  }

  if (action === 'reject') {
    const { data, error } = await supabaseAdmin
      .from('emp_mentor_registrations')
      .update({
        status: 'Rejected',
        rejection_reason: rejectionReason,
        reviewed_by: by,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logEmpAudit(
      'rejected',
      'mentor_registration',
      id,
      `Mentor registration rejected: ${registration.name}`,
      by
    )

    return NextResponse.json(data)
  }

  if (action !== 'approve') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: existingAuth } = await supabaseAdmin
    .from('emp_auth_users')
    .select('id')
    .eq('email', registration.email)
    .maybeSingle()

  if (existingAuth) {
    return NextResponse.json({ error: 'Email already has an account' }, { status: 409 })
  }

  const { data: mentor, error: mentorError } = await supabaseAdmin
    .from('emp_mentors')
    .insert({
      name: registration.name,
      email: registration.email,
      role: registration.role,
      phone: registration.phone,
      department: registration.department,
      photo: registration.photo,
      is_active: true,
      assigned_count: 0,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (mentorError) {
    return NextResponse.json({ error: mentorError.message }, { status: 500 })
  }

  const { error: authError } = await supabaseAdmin.from('emp_auth_users').insert({
    email: registration.email,
    password: registration.password,
    role: 'mentor',
    linked_mentor_id: mentor.id,
    is_active: true,
    created_at: now,
  })

  if (authError) {
    await supabaseAdmin.from('emp_mentors').delete().eq('id', mentor.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('emp_mentor_registrations')
    .update({
      status: 'Approved',
      reviewed_by: by,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('emp_notifications').insert({
    type: 'approval',
    title: 'Mentor approved',
    message: `${registration.name} can now log in as a mentor`,
    action_url: '/login',
  })

  await logEmpAudit(
    'approved',
    'mentor_registration',
    id,
    `Mentor registration approved: ${registration.name}`,
    by
  )

  return NextResponse.json({ registration: data, mentor })
}
