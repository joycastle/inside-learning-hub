'use client'

import { useState, type ReactNode } from 'react'
import { QuizPanel } from '@/components/quiz-panel'
import { VideoPlayer } from '@/components/video-player'

export interface VideoLessonProps {
  unitId: string
  source?: string
  initialProgress: number
  hasQuiz: boolean
  children?: ReactNode
  quizUnlocked?: boolean
}

/** 将播放器进度与测评解锁保持在同一客户端状态中，避免用户刷新页面才能开始答题。 */
export function VideoLesson({ unitId, source, initialProgress, hasQuiz, children, quizUnlocked }: VideoLessonProps) {
  const [unlocked, setUnlocked] = useState(quizUnlocked ?? initialProgress >= 90)

  return (
    <>
      <VideoPlayer
        unitId={unitId}
        source={source}
        initialProgress={initialProgress}
        onUnlocked={() => {
          setUnlocked(true)
          if (!hasQuiz) void fetch(`/api/learning/units/${unitId}/complete`, { method: 'POST' })
        }}
      />
      {children}
      {hasQuiz ? <QuizPanel unitId={unitId} unlocked={unlocked} /> : null}
    </>
  )
}
