import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { buildCourseFunnel, calculateOverviewMetrics } from '@/lib/analytics'
import { departmentCompletion, trainingRecords, videoAnalytics, weeklyCompletionTrend } from '@/lib/demo-data'

export async function GET() {
  await requireAdmin()
  return NextResponse.json({
    metrics: calculateOverviewMetrics(trainingRecords),
    funnel: buildCourseFunnel(trainingRecords),
    completionTrend: weeklyCompletionTrend,
    departmentCompletion,
    videos: videoAnalytics,
  })
}
