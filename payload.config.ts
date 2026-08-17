import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import { collections } from './src/payload/collections'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    meta: { titleSuffix: ' · 乐堡家园内容管理' },
  },
  collections,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? 'postgresql://inside:inside@localhost:5432/inside',
    },
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? 'development-only-payload-secret-change-me',
  serverURL: process.env.APP_URL ?? 'http://localhost:3000',
  routes: {
    admin: '/cms',
    api: '/api/cms',
  },
  plugins: [
    s3Storage({
      enabled: process.env.MINIO_ENABLED === 'true',
      bucket: process.env.MINIO_BUCKET ?? 'inside-hub',
      collections: { media: true },
      signedDownloads: { expiresIn: 900 },
      config: {
        endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
        region: process.env.MINIO_REGION ?? 'us-east-1',
        forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
