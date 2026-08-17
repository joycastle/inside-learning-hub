import 'server-only'

import { payloadClient } from '@/lib/payload-data'

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

/** 删除超过保留期且已经没有任何业务引用的旧资源。Payload 存储适配器会同步删除对应对象。 */
export async function cleanupExpiredMedia() {
  const payload = await payloadClient()
  const cutoff = new Date(Date.now() - RETENTION_MS)
  const result = await payload.find({
    collection: 'media',
    where: { createdAt: { less_than: cutoff.toISOString() } },
    limit: 1000,
    overrideAccess: true,
  })
  let deleted = 0
  for (const media of result.docs as Array<{ id: string | number }>) {
    const [units, articles] = await Promise.all([
      payload.find({ collection: 'units', where: { media: { equals: media.id } }, limit: 1, overrideAccess: true }),
      payload.find({ collection: 'knowledge-articles', where: { media: { equals: media.id } }, limit: 1, overrideAccess: true }),
    ])
    if (units.docs.length || articles.docs.length) continue
    await payload.delete({ collection: 'media', id: media.id, overrideAccess: true })
    deleted += 1
  }
  return { deleted, checked: result.docs.length }
}
