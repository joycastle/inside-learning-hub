import { describe, expect, it } from 'vitest'
import { buildCourseFunnel, calculateOverviewMetrics, getVideoRates } from '@/lib/analytics'
import { trainingRecords, videoAnalytics } from '@/lib/demo-data'

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
