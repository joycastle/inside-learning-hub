'use client'

import type { ReactNode } from 'react'
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
export function VideoLesson({ unitId, source, initialProgress, hasQuiz, children }: VideoLessonProps) {
  return (
    <>
      <VideoPlayer
        unitId={unitId}
        source={source}
        initialProgress={initialProgress}
      />
      {children}
      {hasQuiz ? <QuizPanel unitId={unitId} /> : null}
    </>
  )
}
