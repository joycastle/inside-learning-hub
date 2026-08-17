import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session-core'
import { syncFeishuUser } from '@/lib/payload-user'

const OAUTH_STATE_COOKIE = 'inside_feishu_oauth_state'

interface FeishuTokenResponse {
  code: number
  access_token?: string
  error_description?: string
}

interface FeishuUserResponse {
  code: number
  data?: {
    avatar_url?: string
    email?: string
    en_name?: string
    name: string
    open_id: string
    tenant_key?: string
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET
  const appUrl = process.env.APP_URL ?? url.origin

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ message: '登录状态无效，请重新发起飞书登录' }, { status: 400 })
  }
  if (!appId || !appSecret) {
    return NextResponse.json({ message: '飞书应用凭证未配置' }, { status: 503 })
  }

  const tokenResponse = await fetch('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: appId,
      client_secret: appSecret,
      code,
      redirect_uri: `${appUrl}/api/auth/feishu/callback`,
    }),
    cache: 'no-store',
  })
  const tokenPayload = (await tokenResponse.json()) as FeishuTokenResponse
  if (!tokenResponse.ok || tokenPayload.code !== 0 || !tokenPayload.access_token) {
    return NextResponse.json(
      { message: tokenPayload.error_description ?? '无法获取飞书访问凭证' },
      { status: 502 },
    )
  }

  const userResponse = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    cache: 'no-store',
  })
  const userPayload = (await userResponse.json()) as FeishuUserResponse
  if (!userResponse.ok || userPayload.code !== 0 || !userPayload.data) {
    return NextResponse.json({ message: '无法读取飞书用户信息' }, { status: 502 })
  }

  const allowedTenantKeys = new Set(
    (process.env.FEISHU_ALLOWED_TENANT_KEYS ?? process.env.FEISHU_TENANT_KEY ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
  if (allowedTenantKeys.size && (!userPayload.data.tenant_key || !allowedTenantKeys.has(userPayload.data.tenant_key))) {
    return NextResponse.json({ message: '该飞书账号不属于当前企业' }, { status: 403 })
  }

  const bootstrapAdmins = new Set(
    (process.env.BOOTSTRAP_ADMIN_OPEN_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
  )
  const user = await syncFeishuUser({
    openId: userPayload.data.open_id,
    tenantKey: userPayload.data.tenant_key,
    name: userPayload.data.name,
    englishName: userPayload.data.en_name,
    email: userPayload.data.email,
    avatarUrl: userPayload.data.avatar_url,
    bootstrapRole: bootstrapAdmins.has(userPayload.data.open_id) ? 'superAdmin' : 'employee',
  })

  const token = await createSessionToken(user)
  const response = NextResponse.redirect(new URL('/home', request.url))
  response.cookies.set(OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' })
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}
