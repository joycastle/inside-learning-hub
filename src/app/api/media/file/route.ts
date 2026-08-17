import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { canUserAccessMedia } from '@/lib/payload-data'

export const runtime = 'nodejs'

const safeKey = /^[a-zA-Z0-9/_\-.]+$/

export async function GET(request: Request) {
  const user = await requireUser()
  const key = new URL(request.url).searchParams.get('key') ?? ''
  if (process.env.MINIO_ENABLED === 'true' || !safeKey.test(key) || key.includes('..')) {
    return NextResponse.json({ message: '媒体资源地址无效' }, { status: 400 })
  }
  if (!await canUserAccessMedia(user, key)) return NextResponse.json({ message: '无权访问该媒体资源' }, { status: 403 })

  const filePath = path.resolve(process.cwd(), 'media', key)
  const mediaRoot = path.resolve(process.cwd(), 'media')
  if (!filePath.startsWith(`${mediaRoot}${path.sep}`)) return NextResponse.json({ message: '媒体资源地址无效' }, { status: 400 })
  try {
    const info = await stat(filePath)
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream
    const contentType = key.endsWith('.html') || key.endsWith('.htm') ? 'text/html; charset=utf-8'
      : key.endsWith('.mp4') ? 'video/mp4'
      : key.endsWith('.pdf') ? 'application/pdf'
        : key.endsWith('.doc') ? 'application/msword'
          : key.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : key.endsWith('.png') ? 'image/png'
              : key.endsWith('.jpg') || key.endsWith('.jpeg') ? 'image/jpeg'
                : key.endsWith('.webp') ? 'image/webp' : 'application/octet-stream'
    return new NextResponse(stream, {
      headers: {
        'Content-Length': String(info.size),
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=900',
        'Content-Security-Policy': contentType.startsWith('text/html') ? "sandbox; default-src 'none'; img-src data: https:; style-src 'unsafe-inline' https:; font-src https: data:;" : "default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ message: '媒体文件不存在' }, { status: 404 })
  }
}
