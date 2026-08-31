export type UserRole = 'employee' | 'admin' | 'superAdmin'

export interface AppUser {
  id: string
  name: string
  englishName?: string
  email: string
  avatarUrl?: string
  departmentId: string
  departmentName: string
  role: UserRole
  active: boolean
  joinedAt: string
}

export type UnitType = 'article' | 'pdf' | 'feishuDoc' | 'video' | 'html'
export type LearningStatus = 'notStarted' | 'inProgress' | 'completed' | 'overdue'

export interface LearningResource {
  id: string
  title: string
  url: string
  filename?: string
  mimeType?: string
}

export interface LearningUnit {
  id: string
  courseId: string
  order: number
  title: string
  description: string
  type: UnitType
  durationMinutes: number
  status: LearningStatus
  progress: number
  hasQuiz: boolean
  content?: string[]
  externalUrl?: string
  videoUrl?: string
  mediaId?: string
  mediaIds?: string[]
  resources?: LearningResource[]
}

export interface Course {
  id: string
  pathId: string
  order: number
  title: string
  summary: string
  category: string
  active?: boolean
  durationMinutes: number
  status: LearningStatus
  progress: number
  completedUnits: number
  unitCount: number
  units: LearningUnit[]
}

export interface LearningPath {
  id: string
  enrollmentId: string
  title: string
  summary: string
  dueAt: string
  assignedAt: string
  progress: number
  completedCourses: number
  courseCount: number
  courses: Course[]
}

export interface OnboardingHandout {
  title: string
  summary: string
  mediaId?: string
  mediaUrl?: string
  updatedAt?: string
}

export interface ReferenceDocument {
  id: string
  title: string
  slug: string
  summary: string
  body?: string
  html?: string
  category?: string
  tags: string[]
  mediaId?: string
  mediaUrl?: string
  fileType?: 'html' | 'markdown' | 'pdf' | 'doc' | 'docx' | 'video' | 'image' | 'link'
  required: boolean
  updatedAt: string
}

export type QuestionType = 'single' | 'multiple' | 'trueFalse'

export interface QuestionOption {
  id: string
  label: string
}

export interface QuizQuestion {
  id: string
  courseId: string
  categoryId: string
  type: QuestionType
  prompt: string
  options: QuestionOption[]
  correctOptionIds: string[]
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizAttemptQuestion extends Omit<QuizQuestion, 'correctOptionIds'> {
  correctOptionIds?: string[]
}

export interface QuizAttemptResult {
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
  answers: Record<string, string[]>
  review: Array<{
    questionId: string
    prompt: string
    selectedOptionIds: string[]
    correctOptionIds: string[]
    correct: boolean
    explanation: string
  }>
}

export interface ServiceArticle {
  id: string
  category: 'HR' | '行政' | 'IT'
  title: string
  summary: string
  type: 'article' | 'pdf' | 'feishuDoc' | 'externalLink'
  updatedAt: string
  url?: string
  tags: string[]
  source?: string
  sections?: Array<{
    title: string
    paragraphs?: string[]
    items?: string[]
  }>
}

export interface TrainingRecord {
  enrollmentId?: string
  pathId?: string
  courseId?: string
  userId: string
  userName: string
  departmentName: string
  pathTitle: string
  courseTitle: string
  assignedAt: string
  dueAt: string
  status: LearningStatus
  completedAt?: string
  videoProgress: number
  bestScore?: number
  attempts: number
}

export interface VideoAnalytics {
  id: string
  title: string
  assigned: number
  started: number
  completed: number
  averageWatchMinutes: number
  averageProgress: number
  lastWatchedAt: string
  buckets: Array<{ label: string; value: number }>
}

export interface FeishuDepartment {
  id: string
  name: string
  parentId?: string
}

export interface FeishuEmployee {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  departmentIds: string[]
  departmentName: string
  role?: UserRole
}

export interface FeishuOrganization {
  source: 'feishu' | 'database'
  departments: FeishuDepartment[]
  employees: FeishuEmployee[]
  syncedAt: string
  warning?: string
}
