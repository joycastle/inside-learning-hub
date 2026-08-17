import 'server-only'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const storageClient = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.MINIO_REGION ?? 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
})

const storageKeyPattern = /^[a-zA-Z0-9/_\-.]+$/

export async function createMediaDownloadUrl(key: string) {
  if (!storageKeyPattern.test(key) || key.includes('..')) throw new Error('媒体资源标识不合法')
  if (process.env.MINIO_ENABLED !== 'true') {
    return `${process.env.APP_URL ?? 'http://localhost:3000'}/api/media/file?key=${encodeURIComponent(key)}`
  }
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET ?? 'inside-hub', Key: key }),
    { expiresIn: 900 },
  )
}
