import { z } from 'zod'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoVideoProgress, getVideoProgressKey } from '@/lib/demo-store'
import { computeVideoProgressUpdate } from '@/lib/video-progress'

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

  const key = getVideoProgressKey(user, unitId)
  const current = demoVideoProgress.get(key)
  const update = computeVideoProgressUpdate(user.id, unitId, parsed.data, current)
  if (!update.duplicate) demoVideoProgress.set(key, update.state)
  return NextResponse.json({ ...update.state, completed: update.state.maxProgress >= 90, duplicate: update.duplicate })
}
