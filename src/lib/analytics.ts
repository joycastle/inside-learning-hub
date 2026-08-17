import type { TrainingRecord, VideoAnalytics } from '@/lib/types'

export interface OverviewMetrics {
  assigned: number
  started: number
  completed: number
  completionRate: number
  overdue: number
  averageScore: number
  firstPassRate: number
  averageCompletionDays: number
}

const percentage = (value: number, total: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100)

export const calculateOverviewMetrics = (records: TrainingRecord[]): OverviewMetrics => {
  const assigned = records.length
  const started = records.filter((record) => record.status !== 'notStarted').length
  const completed = records.filter((record) => record.status === 'completed').length
  const overdue = records.filter((record) => record.status === 'overdue').length
  const scoredRecords = records.filter((record) => record.bestScore !== undefined)
  const averageScore = scoredRecords.length
    ? Math.round(
        scoredRecords.reduce((total, record) => total + (record.bestScore ?? 0), 0) /
          scoredRecords.length,
      )
    : 0
  const passedFirstTry = records.filter(
    (record) => (record.bestScore ?? 0) >= 80 && record.attempts === 1,
  ).length

  const completionDurations = records
    .filter((record) => record.completedAt)
    .map((record) => (new Date(record.completedAt as string).getTime() - new Date(record.assignedAt).getTime()) / 86400000)
    .filter((days) => Number.isFinite(days) && days >= 0)

  return {
    assigned,
    started,
    completed,
    completionRate: percentage(completed, assigned),
    overdue,
    averageScore,
    firstPassRate: percentage(passedFirstTry, scoredRecords.length),
    averageCompletionDays: completionDurations.length
      ? Math.round((completionDurations.reduce((total, days) => total + days, 0) / completionDurations.length) * 10) / 10
      : 0,
  }
}

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  department?: string
  path?: string
  course?: string
}

export const filterTrainingRecords = (records: TrainingRecord[], filters: AnalyticsFilters) => records.filter((record) => {
  if (filters.department && filters.department !== 'all' && record.departmentName !== filters.department) return false
  if (filters.dateFrom && record.assignedAt < filters.dateFrom) return false
  if (filters.dateTo && record.assignedAt > filters.dateTo) return false
  if (filters.path && filters.path !== 'all' && filters.path !== 'onboarding' && record.pathTitle !== filters.path) return false
  if (filters.course && filters.course !== 'all' && record.courseTitle !== filters.course) return false
  return true
})

export const getVideoRates = (video: VideoAnalytics) => ({
  startRate: percentage(video.started, video.assigned),
  completionRate: percentage(video.completed, video.started),
  reachedCompletionRate: percentage(video.completed, video.assigned),
})

export const buildCourseFunnel = (records: TrainingRecord[]) => {
  const assigned = records.length
  const startedRecords = records.filter((record) => record.status !== 'notStarted')
  const contentCompletedRecords = startedRecords.filter((record) => record.videoProgress >= 90)
  const quizStartedRecords = contentCompletedRecords.filter((record) => record.attempts > 0)
  const quizPassedRecords = quizStartedRecords.filter((record) => (record.bestScore ?? 0) >= 80)
  const completedRecords = quizPassedRecords.filter((record) => record.status === 'completed')

  return [
    { label: '已分配', value: assigned },
    { label: '已开始', value: startedRecords.length },
    { label: '内容完成', value: contentCompletedRecords.length },
    { label: '开始测评', value: quizStartedRecords.length },
    { label: '测评通过', value: quizPassedRecords.length },
    { label: '课程完成', value: completedRecords.length },
  ]
}
