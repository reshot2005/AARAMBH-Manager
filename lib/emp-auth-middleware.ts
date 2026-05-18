import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifySessionToken,
  EMP_SESSION_COOKIE,
  type EmpSessionPayload,
  type EmpRole,
} from './emp-session'
import { canPerform, type EmpResource, type HttpMethod } from './emp-permissions'

export type AuthContext = EmpSessionPayload

export async function getAuthFromRequest(req?: NextRequest): Promise<AuthContext | null> {
  let token: string | undefined
  if (req) {
    token = req.cookies.get(EMP_SESSION_COOKIE)?.value
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get(EMP_SESSION_COOKIE)?.value
  }
  if (!token) return null
  return verifySessionToken(token)
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(message = 'Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await getAuthFromRequest(req)
  if (!auth) return unauthorized()
  return auth
}

export function assertMethod(
  auth: AuthContext,
  method: HttpMethod,
  resource: EmpResource
): NextResponse | null {
  if (!canPerform(auth.role, method, resource)) {
    return forbidden()
  }
  return null
}

export function performedByLabel(auth: AuthContext): string {
  if (auth.role === 'super_admin') return 'Super Admin'
  if (auth.role === 'admin') return 'Admin'
  if (auth.role === 'mentor') return `Mentor: ${auth.name}`
  return auth.name
}

export async function logEmpAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
  performedBy: string
) {
  const { supabaseAdmin } = await import('./supabase-server')
  await supabaseAdmin.from('emp_activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
    performed_by: performedBy,
  })
}
