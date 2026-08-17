import 'server-only'

import { cookies } from 'next/headers'

type CmsDocument = {
  id: string | number
  title?: string
  name?: string
  summary?: string
  prompt?: string
  slug?: string
  updatedAt?: string
  _status?: string
}

const cmsBaseUrl = () => `${process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:3001'}/api/cms`

export async function getCmsCollection(collection: string, limit = 50): Promise<CmsDocument[]> {
  const cookieHeader = (await cookies()).toString()
  const response = await fetch(`${cmsBaseUrl()}/${collection}?limit=${limit}&depth=1&sort=-updatedAt`, {
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
  })
  if (!response.ok) return []
  const result = await response.json() as { docs?: CmsDocument[] }
  return result.docs ?? []
}
