import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('path'), title: z.string().trim().min(1), summary: z.string().trim().default(''), dueDays: z.number().int().min(1).max(365) }),
  z.object({ kind: z.literal('course'), pathId: z.string().min(1), title: z.string().trim().min(1), summary: z.string().trim().default(''), category: z.string().trim().default('新员工必看'), unitTitle: z.string().trim().optional(), unitType: z.enum(['video', 'article', 'pdf', 'feishuDoc']).default('video'), mediaId: z.union([z.string(), z.number()]).optional() }),
])

const slug = (value: string) => `${value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '培训数据格式错误' }, { status: 400 })
  const payload = await payloadClient()
  if (parsed.data.kind === 'path') {
    const created = await payload.create({ collection: 'learning-paths', data: { title: parsed.data.title, slug: slug(parsed.data.title), summary: parsed.data.summary, defaultDueDays: parsed.data.dueDays, isDefaultOnboarding: false, courses: [] }, overrideAccess: true })
    return NextResponse.json({ id: created.id }, { status: 201 })
  }
  const path = await payload.findByID({ collection: 'learning-paths', id: parsed.data.pathId, depth: 1, overrideAccess: true })
  const createdCourse = await payload.create({ collection: 'courses', data: { title: parsed.data.title, slug: slug(parsed.data.title), path: path.id, order: (path.courses?.length ?? 0) + 1, summary: parsed.data.summary, category: parsed.data.category, durationMinutes: 0, units: [] }, overrideAccess: true })
  const courseUnits: Array<string | number> = []
  if (parsed.data.unitTitle) {
    const unit = await payload.create({ collection: 'units', data: { title: parsed.data.unitTitle, course: createdCourse.id, order: 1, description: parsed.data.summary, type: parsed.data.unitType, durationMinutes: 0, media: parsed.data.mediaId }, overrideAccess: true })
    courseUnits.push(unit.id)
    await payload.update({ collection: 'courses', id: createdCourse.id, data: { units: courseUnits }, overrideAccess: true })
  }
  await payload.update({ collection: 'learning-paths', id: path.id, data: { courses: [...(path.courses ?? []).map((course: string | number | { id: string | number }) => typeof course === 'object' ? course.id : course), createdCourse.id] }, overrideAccess: true })
  return NextResponse.json({ id: createdCourse.id, unitId: courseUnits[0] }, { status: 201 })
}
