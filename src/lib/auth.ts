import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { ApiClientError, getCurrentUserFromApi } from '@/lib/api/server'
import type { AppUser } from '@/lib/types'

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  try {
    return await getCurrentUserFromApi()
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null
    throw error
  }
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
