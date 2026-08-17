import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { buildCourseFunnel, calculateOverviewMetrics } from '@/lib/analytics'
import { departmentCompletion, trainingRecords, videoAnalytics, weeklyCompletionTrend } from '@/lib/demo-data'
import { getTrainingRecords } from '@/lib/payload-data'

export async function GET() {
  await requireAdmin()
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  return NextResponse.json({
    metrics: calculateOverviewMetrics(records),
    funnel: buildCourseFunnel(records),
    completionTrend: weeklyCompletionTrend,
    departmentCompletion,
    videos: videoAnalytics,
  })
}
