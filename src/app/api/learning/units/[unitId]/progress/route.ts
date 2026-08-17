import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { demoUnitProgress, getVideoProgressKey } from '@/lib/demo-store'
import { canUserAccessUnit, getPayloadUserId, payloadClient } from '@/lib/payload-data'

const progressSchema = z.object({ progress: z.number().min(0).max(100) })

export async function PUT(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
  const parsed = progressSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '学习进度格式错误' }, { status: 400 })

  if (process.env.DEMO_MODE === 'false') {
    if (!await canUserAccessUnit(user, unitId)) return NextResponse.json({ message: '无权访问该学习单元' }, { status: 403 })
    const payload = await payloadClient()
    const payloadUserId = await getPayloadUserId(user)
    const progressKey = `${payloadUserId}:${unitId}`
    const existing = await payload.find({ collection: 'unit-progress', where: { progressKey: { equals: progressKey } }, limit: 1, overrideAccess: true })
    const current = existing.docs[0] as { id: string | number; progress?: number; completedAt?: string } | undefined
    const progress = Math.max(current?.progress ?? 0, parsed.data.progress)
    const data = { user: payloadUserId, unit: unitId, progress, status: progress >= 100 ? 'completed' : 'inProgress', completedAt: progress >= 100 ? current?.completedAt ?? new Date().toISOString() : undefined, progressKey }
    const saved = current
      ? await payload.update({ collection: 'unit-progress', id: current.id, data, overrideAccess: true })
      : await payload.create({ collection: 'unit-progress', data, overrideAccess: true })
    return NextResponse.json(saved)
  }

  const key = getVideoProgressKey(user, unitId)
  const current = demoUnitProgress.get(key)
  const progress = Math.max(current?.progress ?? 0, parsed.data.progress)
  const next = {
    userId: user.id,
    unitId,
    progress,
    status: progress >= 100 ? 'completed' as const : 'inProgress' as const,
    updatedAt: new Date().toISOString(),
    completedAt: progress >= 100 ? current?.completedAt ?? new Date().toISOString() : undefined,
  }
  demoUnitProgress.set(key, next)
  return NextResponse.json(next)
}
