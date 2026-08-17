import { SignJWT, jwtVerify } from 'jose'
import type { AppUser } from '@/lib/types'

export const SESSION_COOKIE_NAME = 'inside_session'
const DEMO_SUPER_ADMIN_USER_ID = 'user-chen-yu'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET ?? 'demo-session-secret-change-before-production-2026',
  )

export const createSessionToken = async (user: AppUser) =>
  new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())

export const verifySessionToken = async (token: string): Promise<AppUser | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const user = payload.user as AppUser | undefined
    if (!user?.active) return null

    // 演示账号升级为管理员后，兼容浏览器中已签发的旧员工会话。
    if (process.env.DEMO_MODE !== 'false' && user.id === DEMO_SUPER_ADMIN_USER_ID) {
      return { ...user, role: 'superAdmin' }
    }
    return user
  } catch {
    return null
  }
}
