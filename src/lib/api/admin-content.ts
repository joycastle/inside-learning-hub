import 'server-only'

import { cookies } from 'next/headers'

type AdminContentDocument = {
  id: string | number
  title?: string
  name?: string
  summary?: string
  prompt?: string
  slug?: string
  updatedAt?: string
  _status?: string
}

const adminContentBaseUrl = () => `${process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:3001'}/api/v1/admin/content`

export async function getAdminCollection(collection: string, limit = 50): Promise<AdminContentDocument[]> {
  const cookieHeader = (await cookies()).toString()
  const response = await fetch(`${adminContentBaseUrl()}/${collection}?limit=${limit}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
  })
  if (!response.ok) return []
  const result = await response.json() as { items?: AdminContentDocument[] }
  return result.items ?? []
}
