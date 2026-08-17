import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.object({ userIds: z.array(z.string()).min(1), dueAt: z.string().min(1), pathId: z.string().optional() })

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '分配数据格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const pathResult = parsed.data.pathId
    ? await payload.findByID({ collection: 'learning-paths', id: parsed.data.pathId, overrideAccess: true })
    : (await payload.find({ collection: 'learning-paths', where: { isDefaultOnboarding: { equals: true } }, limit: 1, overrideAccess: true })).docs[0]
  if (!pathResult) return NextResponse.json({ message: '未找到培训路径' }, { status: 404 })
  const assignedAt = new Date().toISOString()
  for (const openId of parsed.data.userIds) {
    const userResult = await payload.find({ collection: 'users', where: { feishuOpenId: { equals: openId } }, limit: 1, overrideAccess: true })
    const employee = userResult.docs[0]
    if (!employee) continue
    const assignmentKey = `${employee.id}:${pathResult.id}:manual`
    const existing = await payload.find({ collection: 'enrollments', where: { assignmentKey: { equals: assignmentKey } }, limit: 1, overrideAccess: true })
    const data = { user: employee.id, learningPath: pathResult.id, assignedAt, dueAt: new Date(parsed.data.dueAt).toISOString(), status: 'notStarted', assignmentKey }
    if (existing.docs[0]) await payload.update({ collection: 'enrollments', id: existing.docs[0].id, data, overrideAccess: true })
    else await payload.create({ collection: 'enrollments', data, overrideAccess: true })
  }
  return NextResponse.json({ ok: true })
}
