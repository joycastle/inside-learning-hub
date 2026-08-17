import { NextResponse } from 'next/server'
import { buildCourseFunnel } from '@/lib/analytics'
import { trainingRecords } from '@/lib/demo-data'
import { requireAdmin } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin()
  const { courseId } = await params
  return NextResponse.json({ courseId, funnel: buildCourseFunnel(trainingRecords), records: trainingRecords })
}
