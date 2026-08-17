import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'inside_session'

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return NextResponse.redirect(new URL('/login', request.url))
  // Proxy 只做无密钥的乐观检查；角色与停用状态由布局调用 auth/me 实时判定。
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
