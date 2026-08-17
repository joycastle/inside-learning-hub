import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoUnitProgress, getVideoProgressKey } from '@/lib/demo-store'
import { canUserAccessUnit, getPayloadUserId, payloadClient } from '@/lib/payload-data'

export async function POST(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
  if (process.env.DEMO_MODE === 'false') {
    if (!await canUserAccessUnit(user, unitId)) return NextResponse.json({ message: '无权访问该学习单元' }, { status: 403 })
    const payload = await payloadClient()
    const payloadUserId = await getPayloadUserId(user)
    const unit = await payload.findByID({ collection: 'units', id: unitId, depth: 0, overrideAccess: true }) as { type?: string }
    if (unit.type === 'video') {
      const videoProgress = await payload.find({ collection: 'video-progress', where: { progressKey: { equals: `${payloadUserId}:${unitId}` } }, limit: 1, overrideAccess: true })
      const maxProgress = (videoProgress.docs[0] as { maxProgress?: number } | undefined)?.maxProgress ?? 0
      if (maxProgress < 90) return NextResponse.json({ message: '视频观看达到 90% 后才能完成本单元' }, { status: 409 })
    }
    const progressKey = `${payloadUserId}:${unitId}`
    const existing = await payload.find({ collection: 'unit-progress', where: { progressKey: { equals: progressKey } }, limit: 1, overrideAccess: true })
    const current = existing.docs[0] as { id: string | number; completedAt?: string } | undefined
    const data = { user: payloadUserId, unit: unitId, progress: 100, status: 'completed', completedAt: current?.completedAt ?? new Date().toISOString(), progressKey }
    const saved = current
      ? await payload.update({ collection: 'unit-progress', id: current.id, data, overrideAccess: true })
      : await payload.create({ collection: 'unit-progress', data, overrideAccess: true })
    return NextResponse.json(saved)
  }
  const key = getVideoProgressKey(user, unitId)
  const current = demoUnitProgress.get(key)
  const completedAt = current?.completedAt ?? new Date().toISOString()
  const next = {
    userId: user.id,
    unitId,
    progress: 100,
    status: 'completed' as const,
    updatedAt: new Date().toISOString(),
    completedAt,
  }
  demoUnitProgress.set(key, next)
  return NextResponse.json(next)
}
