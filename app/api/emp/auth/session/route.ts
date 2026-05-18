import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/emp-auth-middleware'

export async function GET() {
  const auth = await getAuthFromRequest()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    role: auth.role,
    email: auth.email,
    name: auth.name,
    mentorId: auth.mentorId,
    employeeId: auth.employeeId,
  })
}
