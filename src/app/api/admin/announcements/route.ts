import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.object({ id: z.union([z.string(), z.number()]).optional(), title: z.string().trim().min(1), summary: z.string().trim().optional(), audience: z.enum(['all', 'newEmployees', 'departments']), targetUrl: z.string().trim().optional(), status: z.enum(['已发布', '草稿']) })

const toData = (input: z.infer<typeof schema>) => ({ title: input.title, summary: input.summary, audience: input.audience, targetUrl: input.targetUrl || undefined, startsAt: input.status === '已发布' ? new Date().toISOString() : undefined })

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '公告格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const created = await payload.create({ collection: 'announcements', data: toData(parsed.data), draft: parsed.data.status === '草稿', overrideAccess: true })
  return NextResponse.json({ id: created.id }, { status: 201 })
}

export async function PATCH(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success || parsed.data.id === undefined) return NextResponse.json({ message: '公告格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const updated = await payload.update({ collection: 'announcements', id: parsed.data.id, data: toData(parsed.data), draft: parsed.data.status === '草稿', overrideAccess: true })
  return NextResponse.json({ id: updated.id })
}
