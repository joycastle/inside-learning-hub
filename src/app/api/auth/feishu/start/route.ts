import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'

const OAUTH_STATE_COOKIE = 'inside_feishu_oauth_state'

export async function GET(request: Request) {
  const appId = process.env.FEISHU_APP_ID
  const appUrl = process.env.APP_URL ?? new URL(request.url).origin

  if (!appId) {
    if (process.env.DEMO_MODE !== 'false') {
      return NextResponse.redirect(new URL('/login?error=feishu-not-configured', request.url))
    }
    return NextResponse.json({ message: '飞书登录尚未配置' }, { status: 503 })
  }

  const state = randomBytes(24).toString('base64url')
  const redirectUri = `${appUrl}/api/auth/feishu/callback`
  const authorizationUrl = new URL('https://accounts.feishu.cn/open-apis/authen/v1/authorize')
  authorizationUrl.searchParams.set('client_id', appId)
  authorizationUrl.searchParams.set('redirect_uri', redirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authorizationUrl)
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 300,
  })
  return response
}
