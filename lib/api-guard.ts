import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, assertMethod, type AuthContext } from './emp-auth-middleware'
import type { EmpResource, HttpMethod } from './emp-permissions'

export async function withEmpAuth(
  req: NextRequest,
  method: HttpMethod,
  resource: EmpResource,
  handler: (auth: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const denied = assertMethod(auth, method, resource)
  if (denied) return denied
  return handler(auth)
}
