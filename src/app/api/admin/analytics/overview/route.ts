import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { buildCourseFunnel, calculateOverviewMetrics, filterTrainingRecords } from '@/lib/analytics'
import { departmentCompletion, trainingRecords, videoAnalytics, weeklyCompletionTrend } from '@/lib/demo-data'
import { getTrainingRecords, getVideoAnalytics } from '@/lib/payload-data'

export async function GET(request: Request) {
  await requireAdmin()
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  const videos = process.env.DEMO_MODE === 'false' ? await getVideoAnalytics() : videoAnalytics
  const searchParams = new URL(request.url).searchParams
  const filteredRecords = filterTrainingRecords(records, {
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    department: searchParams.get('department') ?? undefined,
    path: searchParams.get('path') ?? undefined,
    course: searchParams.get('course') ?? undefined,
  })
  return NextResponse.json({
    metrics: calculateOverviewMetrics(filteredRecords),
    funnel: buildCourseFunnel(filteredRecords),
    completionTrend: weeklyCompletionTrend,
    departmentCompletion,
    videos,
  })
}
