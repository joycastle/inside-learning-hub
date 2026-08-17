import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createMediaDownloadUrl } from '@/lib/media-storage'

const querySchema = z.string().min(1).max(512)

export async function GET(request: Request) {
  await requireUser()
  const key = new URL(request.url).searchParams.get('key')
  const parsed = querySchema.safeParse(key)
  if (!parsed.success) return NextResponse.json({ message: '缺少媒体资源标识' }, { status: 400 })

  try {
    return NextResponse.json({ url: await createMediaDownloadUrl(parsed.data), expiresIn: 900 })
  } catch {
    return NextResponse.json({ message: '无法生成媒体访问地址' }, { status: 400 })
  }
}
