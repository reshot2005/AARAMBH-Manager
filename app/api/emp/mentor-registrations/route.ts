import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  requireAuth,
  assertMethod,
  performedByLabel,
} from '@/lib/emp-auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const denied = assertMethod(auth, 'GET', 'mentor-registrations')
  if (denied) return denied

  if (auth.role !== 'super_admin' && auth.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const status = new URL(req.url).searchParams.get('status')
  let query = supabaseAdmin
    .from('emp_mentor_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
