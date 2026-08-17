import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-core'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = token ? await verifySessionToken(token) : null
  const canAccessAdmin = user?.role === 'admin' || user?.role === 'superAdmin'

  if (!canAccessAdmin) {
    return NextResponse.json(
      { message: user ? '当前账号没有管理权限' : '请先登录' },
      { status: user ? 403 : 401 },
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
