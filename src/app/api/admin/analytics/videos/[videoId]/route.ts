import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getVideoRates } from '@/lib/analytics'
import { trainingRecords, videoAnalytics } from '@/lib/demo-data'
import { getTrainingRecords, getVideoAnalytics } from '@/lib/payload-data'

export async function GET(_request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  await requireAdmin()
  const { videoId } = await params
  const videos = process.env.DEMO_MODE === 'false' ? await getVideoAnalytics() : videoAnalytics
  const video = videos.find((item) => item.id === videoId)
  if (!video) return NextResponse.json({ message: '视频不存在' }, { status: 404 })
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  return NextResponse.json({
    video,
    rates: getVideoRates(video),
    employees: records.map((record) => ({
      userId: record.userId,
      userName: record.userName,
      departmentName: record.departmentName,
      progress: record.videoProgress,
      state: record.videoProgress >= 90 ? 'completed' : record.videoProgress > 0 ? 'inProgress' : 'notStarted',
    })),
  })
}
