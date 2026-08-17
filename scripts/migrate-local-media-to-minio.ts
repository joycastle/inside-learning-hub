import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import config from '../payload.config'
import { getPayload } from 'payload'

const main = async () => {
  if (process.env.MINIO_ENABLED !== 'true') throw new Error('请先设置 MINIO_ENABLED=true')
  const payload = await getPayload({ config })
  const client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.MINIO_REGION ?? 'us-east-1',
    forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false',
    credentials: { accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin', secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin' },
  })
  const result = await payload.find({ collection: 'media', limit: 1000, overrideAccess: true })
  let migrated = 0
  for (const media of result.docs as Array<{ id: string | number; storageKey?: string; filename?: string; mimeType?: string }>) {
    if (!media.storageKey || media.storageKey.includes('/')) continue
    const localPath = path.resolve(process.cwd(), 'media', media.filename ?? media.storageKey)
    const body = await readFile(localPath).catch(() => null)
    if (!body) continue
    await client.send(new PutObjectCommand({ Bucket: process.env.MINIO_BUCKET ?? 'inside-hub', Key: media.storageKey, Body: body, ContentType: media.mimeType ?? 'application/octet-stream' }))
    migrated += 1
    console.log(`migrated ${media.id}: ${media.storageKey}`)
  }
  console.log(`完成：迁移 ${migrated} 个本地媒体资源。`)
  await payload.db.destroy?.()
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
