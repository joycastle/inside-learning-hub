import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getVideoRates } from '@/lib/analytics'
import { trainingRecords, videoAnalytics } from '@/lib/demo-data'

export async function GET(_request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  await requireAdmin()
  const { videoId } = await params
  const video = videoAnalytics.find((item) => item.id === videoId)
  if (!video) return NextResponse.json({ message: '视频不存在' }, { status: 404 })
  return NextResponse.json({
    video,
    rates: getVideoRates(video),
    employees: trainingRecords.map((record) => ({
      userId: record.userId,
      userName: record.userName,
      departmentName: record.departmentName,
      progress: record.videoProgress,
      state: record.videoProgress >= 90 ? 'completed' : record.videoProgress > 0 ? 'inProgress' : 'notStarted',
    })),
  })
}
