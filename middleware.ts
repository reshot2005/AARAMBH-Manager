import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, EMP_SESSION_COOKIE } from '@/lib/emp-session'

const PUBLIC_PATHS = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(EMP_SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (pathname === '/') {
    const dest = session ? '/dashboard' : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (session.role === 'employee' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/my-profile', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*'],
}
