'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, PlayCircle } from 'lucide-react'
import { ProgressBar } from '@/components/progress-bar'

export interface VideoPlayerProps {
  unitId: string
  source?: string
  initialProgress: number
  onUnlocked?: () => void
}

const STORAGE_VERSION = 1

export function VideoPlayer({ unitId, source, initialProgress, onUnlocked }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const sequenceRef = useRef(0)
  const lastReportedAtRef = useRef(0)
  const [progress, setProgress] = useState(initialProgress)
  const completed = progress >= 90

  const reportProgress = useCallback(
    async (force = false) => {
      const video = videoRef.current
      if (!video || !video.duration) return
      const now = Date.now()
      if (!force && now - lastReportedAtRef.current < 15_000) return

      const nextProgress = Math.min(100, Math.round((video.currentTime / video.duration) * 100))
      sequenceRef.current += 1
      lastReportedAtRef.current = now
      setProgress((current) => {
        const maximumProgress = Math.max(current, nextProgress)
        localStorage.setItem(`inside:video:${unitId}:v${STORAGE_VERSION}`, String(maximumProgress))
        return maximumProgress
      })

      if (nextProgress >= 90) onUnlocked?.()

      await fetch(`/api/videos/${unitId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          sequence: sequenceRef.current,
          currentSeconds: Math.round(video.currentTime),
          durationSeconds: Math.round(video.duration),
          progress: nextProgress,
          event: force ? 'pauseOrEnd' : 'heartbeat',
        }),
      }).catch(() => undefined)
    },
    [onUnlocked, unitId],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const stored = Number(localStorage.getItem(`inside:video:${unitId}:v${STORAGE_VERSION}`))
    const restorePosition = () => {
      if (Number.isFinite(stored) && stored > 0 && video.duration) {
        video.currentTime = Math.min(video.duration - 1, (stored / 100) * video.duration)
        setProgress((current) => Math.max(current, stored))
      }
    }
    video.addEventListener('loadedmetadata', restorePosition, { once: true })
    return () => video.removeEventListener('loadedmetadata', restorePosition)
  }, [unitId])

  if (!source) {
    return (
      <div className="surface empty-state">
        <PlayCircle size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="section-heading">视频将在课程开放后提供</h2>
        <p>当前演示没有为这个单元配置媒体文件。</p>
      </div>
    )
  }

  return (
    <div className="video-shell">
      <video
        ref={videoRef}
        src={source}
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={() => void reportProgress(false)}
        onPause={() => void reportProgress(true)}
        onEnded={() => void reportProgress(true)}
      >
        当前浏览器不支持视频播放。
      </video>
      <div className="video-meta">
        {completed ? (
          <span><CheckCircle2 size={16} aria-hidden="true" /> 已达到完播要求</span>
        ) : (
          <span>观看达到 90% 计为完播</span>
        )}
        <ProgressBar value={progress} label="视频观看进度" />
        <strong className="tabular">{progress}%</strong>
      </div>
    </div>
  )
}
