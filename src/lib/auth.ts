import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-core'
import { findCurrentPayloadUser } from '@/lib/payload-user'
import type { AppUser } from '@/lib/types'

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const sessionUser = token ? await verifySessionToken(token) : null
  if (!sessionUser) return null
  if (process.env.DEMO_MODE !== 'false') return sessionUser

  // 管理权限每次请求都从数据库重新读取，确保降级或停用立即生效。
  return findCurrentPayloadUser(sessionUser.id)
})

export const requireUser = async () => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export const requireAdmin = async () => {
  const user = await requireUser()
  if (user.role !== 'admin' && user.role !== 'superAdmin') redirect('/forbidden')
  return user
}
