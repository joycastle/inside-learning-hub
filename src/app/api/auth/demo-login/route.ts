import { NextResponse } from 'next/server'
import { demoUsers } from '@/lib/demo-data'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session-core'

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === 'false') {
    return NextResponse.json({ message: '演示登录已关闭' }, { status: 404 })
  }

  const formData = await request.formData()
  const role = formData.get('role') === 'admin' ? 'admin' : 'employee'
  const token = await createSessionToken(demoUsers[role])
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: role === 'admin' ? '/admin' : '/home' },
  })
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}
