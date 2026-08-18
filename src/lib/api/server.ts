import 'server-only'

import { cookies } from 'next/headers'
import type { AppUser, FeishuOrganization, LearningPath, OnboardingHandout, ServiceArticle, TrainingRecord, VideoAnalytics } from '@/lib/types'

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

type ListResponse<T> = { items: T[]; page: number; pageSize: number; total: number }

const apiBaseUrl = () => `${process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:3001'}/api/v1`

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { code?: string; message?: string }
    throw new ApiClientError(response.status, error.message ?? '业务服务暂时不可用', error.code)
  }
  return response.json() as Promise<T>
}

export const getCurrentUserFromApi = async () => (await apiRequest<{ user: AppUser }>('/auth/me')).user
export const getEnrollments = async () => (await apiRequest<ListResponse<LearningPath>>('/learning/enrollments')).items
export const getAdminTrainingPaths = async () => (await apiRequest<ListResponse<LearningPath>>('/admin/training/paths')).items
export const getOnboardingHandout = () => apiRequest<OnboardingHandout>('/content/onboarding-handout')
export const getAdminOnboardingHandout = () => apiRequest<OnboardingHandout>('/admin/onboarding-handout')
type Announcement = { id: string | number; title: string; summary: string; body: string; targetUrl?: string; startsAt?: string; endsAt?: string }
export const getAnnouncements = async () => (await apiRequest<ListResponse<Announcement>>('/content/announcements')).items
export const getServiceArticles = async (): Promise<ServiceArticle[]> => {
  type ServiceArticleDocument = { id?: string | number; category?: string; title?: string; summary?: string; externalUrl?: string; html?: string; updatedAt?: string; tags?: unknown[]; source?: string; body?: string }
  const items = await apiRequest<ListResponse<ServiceArticleDocument>>('/content/knowledge-articles')
  return items.items.map((item) => ({ id: String(item.id), category: item.category === '行政' || item.category === 'IT' ? item.category : 'HR', title: String(item.title ?? ''), summary: String(item.summary ?? ''), type: item.externalUrl ? 'externalLink' : 'article', updatedAt: String(item.updatedAt ?? new Date().toISOString()), url: item.externalUrl, tags: Array.isArray(item.tags) ? item.tags.map(String) : [], source: item.source, sections: item.body ? [{ title: '正文', paragraphs: [String(item.body)] }] : undefined }))
}
export const getEnrollment = (id: string) => apiRequest<LearningPath>(`/learning/enrollments/${id}`)
export const getQuizAttempts = async () => (await apiRequest<ListResponse<Record<string, unknown>>>('/me/quiz-attempts')).items

export type AnalyticsOverview = {
  metrics: { assigned: number; completed: number; inProgress: number; overdue: number; completionRate: number }
  funnel: Array<{ label: string; value: number }>
  completionTrend: Array<{ date: string; started: number; completed: number }>
  departmentCompletion: Array<{ department: string; completionRate: number }>
  videos: Array<Record<string, unknown>>
  records: TrainingRecord[]
}

export const getAnalyticsOverview = (query = '') => apiRequest<AnalyticsOverview>(`/admin/analytics/overview${query}`)
export const getOrganization = () => apiRequest<FeishuOrganization>('/admin/feishu/organization')
export type VideoAnalyticsResponse = {
  video: VideoAnalytics
  rates: { startRate: number; completionRate: number; reachedCompletionRate: number }
  employees: Array<{ userId: string; userName: string; departmentName: string; progress: number; watchedSeconds: number; state: string }>
}
export const getVideoAnalytics = (id: string) => apiRequest<VideoAnalyticsResponse>(`/admin/analytics/videos/${id}`)
