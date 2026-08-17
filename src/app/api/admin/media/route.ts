import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'image/png', 'image/jpeg', 'image/webp'])

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
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: '文件不能超过 2GB' }, { status: 413 })
  if (!allowedTypes.has(file.type)) return NextResponse.json({ message: '仅支持 PDF、DOC、DOCX、MP4、PNG、JPG 或 WebP 文件' }, { status: 400 })

  const filename = safeFilename(file.name)
  const prefix = `media/${new Date().toISOString().slice(0, 10)}`
  const storageKey = `${prefix}/${filename}`
  try {
    const payload = await payloadClient()
    const media = await payload.create({
      collection: 'media',
      data: { title, storageKey, private: true, prefix },
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: filename, size: file.size },
      overrideAccess: true,
    })
    return NextResponse.json({ id: media.id, storageKey, filename }, { status: 201 })
  } catch (error) {
    console.error('media upload failed', error)
    return NextResponse.json({ message: '资源上传失败，请检查 MinIO 和数据库配置' }, { status: 500 })
  }
}
