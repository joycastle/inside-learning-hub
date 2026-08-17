import type { AppUser, QuizAttemptResult, QuizQuestion } from '@/lib/types'

export interface StoredAttempt {
  id: string
  userId: string
  unitId: string
  questions: QuizQuestion[]
  submitted: boolean
  result?: QuizAttemptResult
}

export interface VideoProgressState {
  userId: string
  unitId: string
  sessionId: string
  lastSequence: number
  lastCurrentSeconds: number
  maxProgress: number
  watchedSeconds: number
  updatedAt: string
  completedAt?: string
}

export interface UnitProgressState {
  userId: string
  unitId: string
  progress: number
  status: 'inProgress' | 'completed'
  updatedAt: string
  completedAt?: string
}

const globalStore = globalThis as typeof globalThis & {
  insideDemoAttempts?: Map<string, StoredAttempt>
  insideVideoProgress?: Map<string, VideoProgressState>
  insideUnitProgress?: Map<string, UnitProgressState>
}

export const demoAttempts = globalStore.insideDemoAttempts ?? new Map<string, StoredAttempt>()
export const demoVideoProgress = globalStore.insideVideoProgress ?? new Map<string, VideoProgressState>()
export const demoUnitProgress = globalStore.insideUnitProgress ?? new Map<string, UnitProgressState>()

if (process.env.NODE_ENV !== 'production') {
  globalStore.insideDemoAttempts = demoAttempts
  globalStore.insideVideoProgress = demoVideoProgress
  globalStore.insideUnitProgress = demoUnitProgress
}

export const getVideoProgressKey = (user: AppUser, unitId: string) => `${user.id}:${unitId}`
