import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'
import { cleanupExpiredMedia } from '@/lib/media-retention'

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('path'), title: z.string().trim().min(1), summary: z.string().trim().default(''), dueDays: z.number().int().min(1).max(365) }),
  z.object({ kind: z.literal('course'), pathId: z.string().min(1), title: z.string().trim().min(1), summary: z.string().trim().default(''), category: z.string().trim().default('新员工必看'), unitTitle: z.string().trim().optional(), unitType: z.enum(['video', 'article', 'pdf', 'feishuDoc', 'html']).default('video'), mediaId: z.union([z.string(), z.number()]).optional() }),
  z.object({ kind: z.literal('unit'), unitId: z.union([z.string(), z.number()]), title: z.string().trim().min(1), description: z.string().trim().default(''), unitType: z.enum(['video', 'article', 'pdf', 'feishuDoc', 'html']), mediaId: z.union([z.string(), z.number()]).optional() }),
])

const slug = (value: string) => `${value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`
const relationId = (value: string | number) => {
  if (typeof value === 'number') return value
  return /^\d+$/.test(value) ? Number(value) : value
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ message: '培训数据格式错误' }, { status: 400 })
    const payload = await payloadClient()
    if (parsed.data.kind === 'path') {
      const created = await payload.create({ collection: 'learning-paths', data: { title: parsed.data.title, slug: slug(parsed.data.title), summary: parsed.data.summary, defaultDueDays: parsed.data.dueDays, isDefaultOnboarding: false, courses: [] }, overrideAccess: true })
      return NextResponse.json({ id: created.id }, { status: 201 })
    }
    if (parsed.data.kind === 'unit') {
      const data = { title: parsed.data.title, description: parsed.data.description, type: parsed.data.unitType, media: parsed.data.mediaId === undefined ? null : relationId(parsed.data.mediaId) }
      const unit = await payload.update({ collection: 'units', id: relationId(parsed.data.unitId), data, overrideAccess: true })
      return NextResponse.json({ id: unit.id })
    }
    const path = await payload.findByID({ collection: 'learning-paths', id: parsed.data.pathId, depth: 1, overrideAccess: true })
    const transactionID = await payload.db.beginTransaction()
    if (!transactionID) throw new Error('数据库不支持培训创建事务')
    const req = { transactionID }
    try {
      const createdCourse = await payload.create({ collection: 'courses', data: { title: parsed.data.title, slug: slug(parsed.data.title), path: path.id, order: (path.courses?.length ?? 0) + 1, summary: parsed.data.summary, category: parsed.data.category, durationMinutes: 0, units: [] }, req, overrideAccess: true })
      const courseUnits: Array<string | number> = []
      if (parsed.data.unitTitle) {
        const unit = await payload.create({ collection: 'units', data: { title: parsed.data.unitTitle, course: createdCourse.id, order: 1, description: parsed.data.summary, type: parsed.data.unitType, durationMinutes: 0, ...(parsed.data.mediaId !== undefined ? { media: relationId(parsed.data.mediaId) } : {}) }, req, overrideAccess: true })
        courseUnits.push(unit.id)
        await payload.update({ collection: 'courses', id: createdCourse.id, data: { units: courseUnits }, req, overrideAccess: true })
      }
      await payload.update({ collection: 'learning-paths', id: path.id, data: { courses: [...(path.courses ?? []).map((course: string | number | { id: string | number }) => typeof course === 'object' ? course.id : course), createdCourse.id] }, req, overrideAccess: true })
      await payload.db.commitTransaction(transactionID)
      await cleanupExpiredMedia().catch(() => undefined)
      return NextResponse.json({ id: createdCourse.id, unitId: courseUnits[0] }, { status: 201 })
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID).catch(() => undefined)
      throw error
    }
  } catch (error) {
    console.error('training save failed', error)
    const detail = process.env.NODE_ENV === 'development' && error instanceof Error ? `：${error.message}` : ''
    return NextResponse.json({ message: `学习单元保存失败，请检查数据库和资源配置${detail}` }, { status: 500 })
  }
}
