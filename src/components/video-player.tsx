'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, PlayCircle } from 'lucide-react'
import { ProgressBar } from '@/components/progress-bar'

export interface VideoPlayerProps {
  unitId: string
  source?: string
  initialProgress: number
}

export function VideoPlayer({ unitId, source, initialProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const sequenceRef = useRef(0)
  const lastReportedAtRef = useRef(0)
  const [progress, setProgress] = useState(initialProgress)
  const [mediaError, setMediaError] = useState(false)
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
        return Math.max(current, nextProgress)
      })

      await fetch(`/api/v1/learning/units/${unitId}/video-progress`, {
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
    [unitId],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const restorePosition = () => {
      if (initialProgress > 0 && video.duration) {
        video.currentTime = Math.min(video.duration - 1, (initialProgress / 100) * video.duration)
      }
    }
    video.addEventListener('loadedmetadata', restorePosition, { once: true })
    return () => video.removeEventListener('loadedmetadata', restorePosition)
  }, [initialProgress])

  if (!source) {
    return (
      <div className="surface empty-state">
        <PlayCircle size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="section-heading">视频将在课程开放后提供</h2>
        <p>内容管理员尚未为这个单元配置媒体文件。</p>
      </div>
    )
  }

  if (mediaError) {
    return (
      <div className="surface empty-state" role="alert">
        <PlayCircle size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="section-heading">视频暂时无法播放</h2>
        <p>视频文件加载失败，请刷新页面重试；如果问题持续，请联系管理员。</p>
        <button className="button button--secondary" type="button" onClick={() => setMediaError(false)}>重试</button>
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
        onError={() => setMediaError(true)}
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
        <a className="video-meta__download" href={`${source}${source.includes('?') ? '&' : '?'}download=1`} download>下载视频</a>
      </div>
    </div>
  )
}
