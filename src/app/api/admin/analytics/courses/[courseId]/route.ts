import { NextResponse } from 'next/server'
import { buildCourseFunnel } from '@/lib/analytics'
import { trainingRecords } from '@/lib/demo-data'
import { requireAdmin } from '@/lib/auth'
import { getTrainingRecords } from '@/lib/payload-data'

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin()
  const { courseId } = await params
  const records = process.env.DEMO_MODE === 'false' ? (await getTrainingRecords()).filter((record) => record.courseId === courseId) : trainingRecords.filter((record) => record.courseId === courseId || !record.courseId)
  if (!records.length) return NextResponse.json({ message: '课程统计不存在' }, { status: 404 })
  return NextResponse.json({ courseId, funnel: buildCourseFunnel(records), records })
}
