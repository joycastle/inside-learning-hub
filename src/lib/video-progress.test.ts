import { describe, expect, it } from 'vitest'
import { computeVideoProgressUpdate } from '@/lib/video-progress'

describe('video progress', () => {
  const now = new Date('2026-08-14T02:00:00.000Z')

  it('ignores duplicate and out-of-order reports', () => {
    const first = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 1, currentSeconds: 10, progress: 10 }, undefined, now).state
    const duplicate = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 1, currentSeconds: 25, progress: 25 }, first, now)
    expect(duplicate.duplicate).toBe(true)
    expect(duplicate.state.watchedSeconds).toBe(0)
  })

  it('clamps watch increments and never decreases maximum progress', () => {
    const first = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 1, currentSeconds: 20, progress: 80 }, undefined, now).state
    const second = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 2, currentSeconds: 90, progress: 65 }, first, now).state
    expect(second.watchedSeconds).toBe(30)
    expect(second.maxProgress).toBe(80)
  })

  it('marks 90 percent as completed once', () => {
    const completed = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 1, currentSeconds: 90, progress: 90 }, undefined, now).state
    expect(completed.completedAt).toBe(now.toISOString())
    const later = computeVideoProgressUpdate('user-1', 'unit-1', { sessionId: 'session-1', sequence: 2, currentSeconds: 95, progress: 95 }, completed, new Date('2026-08-14T02:01:00.000Z')).state
    expect(later.completedAt).toBe(now.toISOString())
  })
})
