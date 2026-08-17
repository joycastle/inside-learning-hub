import { z } from 'zod'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoVideoProgress, getVideoProgressKey } from '@/lib/demo-store'
import { computeVideoProgressUpdate } from '@/lib/video-progress'
import { getPayloadUserId, payloadClient } from '@/lib/payload-data'

const progressSchema = z.object({
  sessionId: z.string().min(1).max(100),
  sequence: z.number().int().positive(),
  currentSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive().max(43_200),
  progress: z.number().min(0).max(100),
  event: z.enum(['heartbeat', 'pauseOrEnd']),
})

export async function PUT(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
  const parsed = progressSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '视频进度数据格式错误' }, { status: 400 })

  if (process.env.DEMO_MODE === 'false') {
    const payload = await payloadClient()
    const payloadUserId = await getPayloadUserId(user)
    const progressKey = `${payloadUserId}:${unitId}`
    const progressResult = await payload.find({ collection: 'video-progress', where: { progressKey: { equals: progressKey } }, limit: 1, overrideAccess: true })
    const existing = progressResult.docs[0] as { id: string | number; sessionId?: string; lastSequence?: number; currentSeconds?: number; maxProgress?: number; watchedSeconds?: number; completedAt?: string } | undefined
    const current = existing ? {
      userId: user.id,
      unitId,
      sessionId: existing.sessionId ?? parsed.data.sessionId,
      lastSequence: existing.lastSequence ?? 0,
      lastCurrentSeconds: existing.currentSeconds ?? 0,
      maxProgress: existing.maxProgress ?? 0,
      watchedSeconds: existing.watchedSeconds ?? 0,
      updatedAt: new Date().toISOString(),
      completedAt: existing.completedAt,
    } : undefined
    const update = computeVideoProgressUpdate(user.id, unitId, parsed.data, current)
    if (!update.duplicate) {
      const data = {
        user: payloadUserId,
        unit: unitId,
        firstPlayedAt: existing ? undefined : update.state.updatedAt,
        lastPlayedAt: update.state.updatedAt,
        currentSeconds: parsed.data.currentSeconds,
        maxSeconds: parsed.data.durationSeconds,
        watchedSeconds: update.state.watchedSeconds,
        maxProgress: update.state.maxProgress,
        completed: update.state.maxProgress >= 90,
        completedAt: update.state.completedAt,
        progressKey,
      }
      if (existing) await payload.update({ collection: 'video-progress', id: existing.id, data, overrideAccess: true })
      else await payload.create({ collection: 'video-progress', data, overrideAccess: true })
      const sessionResult = await payload.find({ collection: 'video-playback-sessions', where: { and: [{ user: { equals: payloadUserId } }, { unit: { equals: unitId } }, { sessionId: { equals: parsed.data.sessionId } }] }, limit: 1, overrideAccess: true })
      const session = sessionResult.docs[0] as { id: string | number } | undefined
      const sessionData = { user: payloadUserId, unit: unitId, sessionId: parsed.data.sessionId, lastSequence: parsed.data.sequence, lastReportedAt: update.state.updatedAt }
      if (session) await payload.update({ collection: 'video-playback-sessions', id: session.id, data: sessionData, overrideAccess: true })
      else await payload.create({ collection: 'video-playback-sessions', data: sessionData, overrideAccess: true })
    }
    return NextResponse.json({ ...update.state, completed: update.state.maxProgress >= 90, duplicate: update.duplicate })
  }

  const key = getVideoProgressKey(user, unitId)
  const current = demoVideoProgress.get(key)
  const update = computeVideoProgressUpdate(user.id, unitId, parsed.data, current)
  if (!update.duplicate) demoVideoProgress.set(key, update.state)
  return NextResponse.json({ ...update.state, completed: update.state.maxProgress >= 90, duplicate: update.duplicate })
}
