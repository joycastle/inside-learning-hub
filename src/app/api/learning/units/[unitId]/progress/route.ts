import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { demoUnitProgress, getVideoProgressKey } from '@/lib/demo-store'

const progressSchema = z.object({ progress: z.number().min(0).max(100) })

export async function PUT(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
  const parsed = progressSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '学习进度格式错误' }, { status: 400 })

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
