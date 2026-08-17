import { describe, expect, it } from 'vitest'
import { buildCourseFunnel, calculateOverviewMetrics, getVideoRates } from '@/lib/analytics'
import type { TrainingRecord, VideoAnalytics } from '@/lib/types'

const trainingRecords: TrainingRecord[] = [
  { userId: 'u1', userName: 'A', departmentName: '研发', pathTitle: '入职', courseTitle: '说明', assignedAt: '2026-08-01', dueAt: '2026-08-08', status: 'completed', videoProgress: 100, bestScore: 90, attempts: 1 },
  { userId: 'u2', userName: 'B', departmentName: '产品', pathTitle: '入职', courseTitle: '说明', assignedAt: '2026-08-01', dueAt: '2026-08-08', status: 'inProgress', videoProgress: 50, attempts: 0 },
]
const videoAnalytics: VideoAnalytics[] = [{
  id: 'v1', title: '说明', assigned: 2, started: 2, completed: 1, averageWatchMinutes: 8,
  averageProgress: 75, lastWatchedAt: '2026-08-01T00:00:00.000Z', buckets: [],
}]

describe('learning analytics', () => {
  it('keeps overview totals internally consistent', () => {
    const metrics = calculateOverviewMetrics(trainingRecords)
    expect(metrics.assigned).toBe(trainingRecords.length)
    expect(metrics.started).toBeGreaterThanOrEqual(metrics.completed)
    expect(metrics.completionRate).toBe(Math.round((metrics.completed / metrics.assigned) * 100))
  })

  it('builds a non-increasing course funnel', () => {
    const funnel = buildCourseFunnel(trainingRecords)
    expect(funnel).toHaveLength(6)
    funnel.slice(1).forEach((step, index) => {
      expect(step.value).toBeLessThanOrEqual(funnel[index].value)
    })
  })

  it('uses started employees as the video completion denominator', () => {
    const video = videoAnalytics[0]
    const rates = getVideoRates(video)
    expect(rates.completionRate).toBe(Math.round((video.completed / video.started) * 100))
    expect(rates.reachedCompletionRate).toBe(Math.round((video.completed / video.assigned) * 100))
  })
})
