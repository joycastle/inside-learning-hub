import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/session-core'

export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: '/login' } })
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
