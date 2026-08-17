import type { VideoProgressState } from '@/lib/demo-store'

export interface VideoProgressReport {
  sessionId: string
  sequence: number
  currentSeconds: number
  progress: number
}

export interface VideoProgressUpdate {
  state: VideoProgressState
  duplicate: boolean
}

/** 只累计同一播放会话中的正向时间差，并用序号拒绝重复或乱序上报。 */
export function computeVideoProgressUpdate(
  userId: string,
  unitId: string,
  report: VideoProgressReport,
  current?: VideoProgressState,
  now = new Date(),
): VideoProgressUpdate {
  const sameSession = current?.sessionId === report.sessionId
  if (sameSession && report.sequence <= current.lastSequence) {
    return { state: current, duplicate: true }
  }

  const effectiveSeconds = sameSession
    ? Math.min(30, Math.max(0, report.currentSeconds - current.lastCurrentSeconds))
    : 0
  const maxProgress = Math.max(current?.maxProgress ?? 0, report.progress)
  const timestamp = now.toISOString()
  return {
    duplicate: false,
    state: {
      userId,
      unitId,
      sessionId: report.sessionId,
      lastSequence: report.sequence,
      lastCurrentSeconds: report.currentSeconds,
      maxProgress,
      watchedSeconds: (current?.watchedSeconds ?? 0) + effectiveSeconds,
      updatedAt: timestamp,
      completedAt: maxProgress >= 90 ? current?.completedAt ?? timestamp : undefined,
    },
  }
}
