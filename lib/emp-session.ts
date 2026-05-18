import { SignJWT, jwtVerify } from 'jose'

export type EmpRole = 'super_admin' | 'admin' | 'mentor' | 'employee'

export interface EmpSessionPayload {
  role: EmpRole
  email: string
  name: string
  mentorId?: string
  employeeId?: string
}

export const EMP_SESSION_COOKIE = 'emp_session'

function getSecret(): Uint8Array {
  const raw =
    process.env.EMP_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'emp-portal-dev-secret-change-me'
  return new TextEncoder().encode(raw)
}

export async function createSessionToken(payload: EmpSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<EmpSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      role: payload.role as EmpRole,
      email: String(payload.email),
      name: String(payload.name),
      mentorId: payload.mentorId ? String(payload.mentorId) : undefined,
      employeeId: payload.employeeId ? String(payload.employeeId) : undefined,
    }
  } catch {
    return null
  }
}
