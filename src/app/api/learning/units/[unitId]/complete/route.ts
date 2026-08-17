import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoUnitProgress, getVideoProgressKey } from '@/lib/demo-store'

export async function POST(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
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
