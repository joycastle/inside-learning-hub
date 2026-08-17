import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'
import { cleanupExpiredMedia } from '@/lib/media-retention'

const MAX_FILE_SIZE = 512 * 1024 * 1024
const allowedTypes = new Set(['text/html', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'image/png', 'image/jpeg', 'image/webp'])

const safeFilename = (name: string) => {
  const ext = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : ''
  const stem = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'resource'
  return `${stem}-${crypto.randomUUID().slice(0, 8)}${ext}`
}

export async function POST(request: Request) {
  await requireAdmin()
  const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') ?? '').trim()
  if (!(file instanceof File) || !file.size || !title) return NextResponse.json({ message: '请提供资源标题和文件' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: '文件不能超过 512MB' }, { status: 413 })
  if (!allowedTypes.has(file.type)) return NextResponse.json({ message: '仅支持 HTML、PDF、DOC、DOCX、MP4、PNG、JPG 或 WebP 文件' }, { status: 400 })

  const filename = safeFilename(file.name)
  const useMinio = process.env.MINIO_ENABLED === 'true'
  const prefix = `media/${new Date().toISOString().slice(0, 10)}`
  const storageKey = useMinio ? `${prefix}/${filename}` : filename
  try {
    const payload = await payloadClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const detected = await fileTypeFromBuffer(buffer.subarray(0, 4100))
    const requiresSignature = file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'video/mp4'
    if (requiresSignature && detected && detected.mime !== file.type) {
      return NextResponse.json({ message: '文件内容与扩展名或 MIME 类型不一致' }, { status: 400 })
    }
    if (!useMinio) {
      const localDir = path.resolve(process.cwd(), 'media')
      await mkdir(localDir, { recursive: true })
      await writeFile(path.join(localDir, filename), buffer)
    }
    const data = {
      title,
      storageKey,
      private: true,
      ...(useMinio ? { prefix } : {}),
      filename,
      mimeType: file.type,
      filesize: file.size,
      url: `/api/media/file?key=${encodeURIComponent(storageKey)}`,
    }
    const media = useMinio
      ? await payload.create({
          collection: 'media',
          data,
          file: { data: buffer, mimetype: file.type, name: filename, size: file.size },
          overrideAccess: true,
        })
      : await payload.create({ collection: 'media', data, filePath: path.join(process.cwd(), 'media', filename), overrideAccess: true })
    const retention = await cleanupExpiredMedia().catch(() => ({ deleted: 0 }))
    return NextResponse.json({ id: media.id, storageKey, filename, retention }, { status: 201 })
  } catch (error) {
    if (!useMinio) {
      await import('node:fs/promises').then(({ unlink }) => unlink(path.join(process.cwd(), 'media', filename))).catch(() => undefined)
    }
    console.error('media upload failed', error)
    const detail = process.env.NODE_ENV === 'development' && error instanceof Error ? `：${error.message}` : ''
    return NextResponse.json({ message: `资源上传失败，请检查文件格式、数据库或本地存储配置${detail}` }, { status: 500 })
  }
}
