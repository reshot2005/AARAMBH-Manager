import { NextResponse } from 'next/server'
import { EMP_SESSION_COOKIE } from '@/lib/emp-session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(EMP_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
