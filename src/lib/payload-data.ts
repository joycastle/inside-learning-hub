import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import type { AppUser, Course, LearningPath, LearningUnit, QuizQuestion, ServiceArticle, TrainingRecord } from '@/lib/types'

type PayloadId = string | number
type Relation<T = { id: PayloadId }> = PayloadId | T

interface PayloadUnit {
  id: PayloadId
  title: string
  description?: string | null
  order?: number | null
  type: LearningUnit['type']
  durationMinutes?: number | null
  externalUrl?: string | null
  quizRule?: Relation | null
}

interface PayloadCourse {
  id: PayloadId
  title: string
  slug?: string
  summary?: string | null
  category?: string | null
  durationMinutes?: number | null
  order?: number | null
  units?: Relation<PayloadUnit>[] | null
}

interface PayloadPath {
  id: PayloadId
  title: string
  slug?: string
  summary?: string | null
  defaultDueDays?: number | null
  courses?: Relation<PayloadCourse>[] | null
}

interface PayloadEnrollment {
  id: PayloadId
  learningPath: Relation<PayloadPath>
  assignedAt: string
  dueAt: string
  status: LearningPath['courses'][number]['status']
}

interface PayloadProgress {
  unit: Relation
  status?: LearningUnit['status']
  progress?: number | null
}

interface PayloadCategory {
  id: PayloadId
  name: string
}

interface PayloadArticle {
  id: PayloadId
  title: string
  summary?: string | null
  slug?: string
  type?: ServiceArticle['type']
  bodyText?: string | null
  source?: string | null
  externalUrl?: string | null
  tags?: Array<{ label: string }>
  category: Relation<PayloadCategory>
  updatedAt: string
}

interface PayloadQuestion {
  id: PayloadId
  course?: Relation
  category?: Relation<PayloadCategory>
  type: QuizQuestion['type']
  prompt: string
  options: Array<{ optionId: string; label: string; correct?: boolean }>
  explanation?: string | null
  difficulty?: QuizQuestion['difficulty']
}

const isDocument = (value: unknown): value is { id: PayloadId } => (
  typeof value === 'object' && value !== null && 'id' in value
)

const relationId = (value: unknown) => String(isDocument(value) ? value.id : value ?? '')

const payloadClient = async () => getPayload({ config }) as any

const toUnit = (unit: PayloadUnit, progress?: PayloadProgress): LearningUnit => ({
  id: String(unit.id),
  courseId: '',
  order: unit.order ?? 0,
  title: unit.title,
  description: unit.description ?? '',
  type: unit.type,
  durationMinutes: unit.durationMinutes ?? 0,
  status: progress?.status ?? 'notStarted',
  progress: progress?.progress ?? 0,
  hasQuiz: Boolean(unit.quizRule),
  externalUrl: unit.externalUrl ?? undefined,
})

const toCourse = (course: PayloadCourse, progressByUnit: Map<string, PayloadProgress>): Course => {
  const units = (course.units ?? [])
    .filter((unit): unit is PayloadUnit => isDocument(unit))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((unit) => ({ ...toUnit(unit, progressByUnit.get(String(unit.id))), courseId: String(course.id) }))
  const progress = units.length ? Math.round(units.reduce((sum, unit) => sum + unit.progress, 0) / units.length) : 0
  return {
    id: String(course.id),
    pathId: '',
    order: course.order ?? 0,
    title: course.title,
    summary: course.summary ?? '',
    category: course.category ?? '',
    durationMinutes: course.durationMinutes ?? units.reduce((sum, unit) => sum + unit.durationMinutes, 0),
    status: progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted',
    progress,
    completedUnits: units.filter((unit) => unit.status === 'completed').length,
    unitCount: units.length,
    units,
  }
}

export async function getLearningPathForUser(user: AppUser): Promise<LearningPath | null> {
  const payload = await payloadClient()
  const payloadUserId = await getPayloadUserId(user)
  const enrollments = await payload.find({
    collection: 'enrollments',
    where: { user: { equals: payloadUserId } },
    depth: 3,
    limit: 1,
    sort: '-assignedAt',
    overrideAccess: true,
  })
  let enrollment = enrollments.docs[0] as unknown as PayloadEnrollment | undefined
  if (!enrollment) {
    const defaults = await payload.find({
      collection: 'learning-paths',
      where: { isDefaultOnboarding: { equals: true } },
      depth: 3,
      limit: 1,
      overrideAccess: true,
    })
    const defaultPath = defaults.docs[0] as unknown as PayloadPath | undefined
    if (!defaultPath) return null
    const assignedAt = new Date()
    const dueAt = new Date(assignedAt)
    dueAt.setDate(dueAt.getDate() + (defaultPath.defaultDueDays ?? 7))
    const created = await payload.create({
      collection: 'enrollments',
      data: {
        user: payloadUserId,
        learningPath: defaultPath.id,
        assignedAt: assignedAt.toISOString(),
        dueAt: dueAt.toISOString(),
        status: 'notStarted',
        assignmentKey: `${user.id}:${defaultPath.id}:default`,
      },
      depth: 3,
      overrideAccess: true,
    })
    enrollment = created as unknown as PayloadEnrollment
  }

  const path = isDocument(enrollment.learningPath) ? enrollment.learningPath as PayloadPath : null
  if (!path) return null
  const progressResult = await payload.find({
    collection: 'unit-progress',
    where: { user: { equals: payloadUserId } },
    limit: 1000,
    overrideAccess: true,
  })
  const progressByUnit = new Map<string, PayloadProgress>(progressResult.docs.map((item: unknown) => {
    const progress = item as unknown as PayloadProgress
    return [relationId(progress.unit), progress]
  }))
  const courses = (path.courses ?? [])
    .filter((course): course is PayloadCourse => isDocument(course))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((course) => ({ ...toCourse(course, progressByUnit), pathId: String(path.id) }))
  const progress = courses.length ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length) : 0
  return {
    id: String(path.id),
    title: path.title,
    summary: path.summary ?? '',
    dueAt: enrollment.dueAt,
    assignedAt: enrollment.assignedAt,
    progress,
    completedCourses: courses.filter((course) => course.status === 'completed').length,
    courseCount: courses.length,
    courses,
  }
}

export async function getCourseById(courseId: string, user: AppUser): Promise<Course | null> {
  const path = await getLearningPathForUser(user)
  return path?.courses.find((course) => course.id === courseId) ?? null
}

export async function getDefaultLearningPath(): Promise<LearningPath | null> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'learning-paths', where: { isDefaultOnboarding: { equals: true } }, depth: 3, limit: 1, overrideAccess: true })
  const path = result.docs[0] as unknown as PayloadPath | undefined
  if (!path) return null
  const courses = (path.courses ?? [])
    .filter((course): course is PayloadCourse => isDocument(course))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((course) => ({ ...toCourse(course, new Map()), pathId: String(path.id) }))
  return { id: String(path.id), title: path.title, summary: path.summary ?? '', assignedAt: new Date().toISOString(), dueAt: new Date(Date.now() + (path.defaultDueDays ?? 7) * 86400000).toISOString(), progress: 0, completedCourses: 0, courseCount: courses.length, courses }
}

export async function getAllQuizQuestions(): Promise<QuizQuestion[]> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'questions', where: { status: { equals: 'published' } }, depth: 1, limit: 1000, overrideAccess: true })
  return (result.docs as unknown as PayloadQuestion[]).map((question) => ({
    id: String(question.id),
    courseId: relationId(question.course),
    categoryId: relationId(question.category),
    type: question.type,
    prompt: question.prompt,
    options: question.options.map((option) => ({ id: option.optionId, label: option.label })),
    correctOptionIds: question.options.filter((option) => option.correct).map((option) => option.optionId),
    explanation: question.explanation ?? '',
    difficulty: question.difficulty ?? 'easy',
  }))
}

export async function getTrainingRecords(): Promise<TrainingRecord[]> {
  const payload = await payloadClient()
  const enrollments = await payload.find({ collection: 'enrollments', depth: 3, limit: 1000, overrideAccess: true })
  const progress = await payload.find({ collection: 'video-progress', limit: 1000, overrideAccess: true })
  const attempts = await payload.find({ collection: 'quiz-attempts', limit: 1000, overrideAccess: true })
  const progressByKey = new Map<string, { maxProgress?: number }>()
  for (const item of progress.docs as Array<{ user: Relation; unit: Relation; maxProgress?: number }>) progressByKey.set(`${relationId(item.user)}:${relationId(item.unit)}`, item)
  return (enrollments.docs as Array<{ user: Relation<{ id: PayloadId; name?: string; department?: Relation<{ id: PayloadId; name?: string }> }>; learningPath: Relation<PayloadPath>; assignedAt: string; dueAt: string; status?: LearningUnit['status']; completedAt?: string }>).flatMap((enrollment) => {
    const path = isDocument(enrollment.learningPath) ? enrollment.learningPath as PayloadPath : null
    const user = isDocument(enrollment.user) ? enrollment.user : null
    const course = path?.courses?.find(isDocument) as PayloadCourse | undefined
    if (!path || !user || !course) return []
    const units = (course.units ?? []).filter((unit): unit is PayloadUnit => isDocument(unit))
    const progressValues = units.map((unit) => progressByKey.get(`${user.id}:${unit.id}`)?.maxProgress ?? 0)
    const videoProgress = progressValues.length ? Math.max(...progressValues) : 0
    const userAttempts = (attempts.docs as Array<{ user: Relation; unit: Relation; score?: number; submittedAt?: string }>).filter((attempt) => relationId(attempt.user) === String(user.id) && units.some((unit) => relationId(attempt.unit) === String(unit.id)) && attempt.submittedAt)
    const scores = userAttempts.map((attempt) => attempt.score).filter((score): score is number => typeof score === 'number')
    const department = isDocument(user.department) ? user.department.name : '待同步部门'
    return [{ userId: String(user.id), userName: user.name ?? '未命名员工', departmentName: department ?? '待同步部门', pathTitle: path.title, courseTitle: course.title, assignedAt: enrollment.assignedAt, dueAt: enrollment.dueAt, status: enrollment.status ?? 'notStarted', completedAt: enrollment.completedAt, videoProgress, bestScore: scores.length ? Math.max(...scores) : undefined, attempts: userAttempts.length }]
  })
}

export async function getServiceArticles(): Promise<ServiceArticle[]> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'knowledge-articles', where: { status: { equals: 'published' } }, depth: 2, limit: 1000, sort: '-updatedAt', overrideAccess: true })
  return (result.docs as unknown as PayloadArticle[]).map((article) => {
    const category = isDocument(article.category) ? article.category.name : 'HR'
    return {
      id: String(article.id),
      category: category as ServiceArticle['category'],
      title: article.title,
      summary: article.summary ?? '',
      type: article.type ?? 'article',
      updatedAt: article.updatedAt,
      url: article.externalUrl ?? undefined,
      tags: (article.tags ?? []).map((tag) => tag.label),
      source: article.source ?? undefined,
      sections: article.bodyText ? [{ title: '正文', paragraphs: article.bodyText.split(/\n+/).filter(Boolean) }] : undefined,
    }
  })
}

export async function getQuestionsForUnit(unitId: string): Promise<QuizQuestion[]> {
  const payload = await payloadClient()
  const unitResult = await payload.findByID({ collection: 'units', id: unitId, depth: 1, overrideAccess: true })
  const quizRule = unitResult.quizRule
  const rule = isDocument(quizRule) ? quizRule as { id: PayloadId; questionCount?: number } : null
  const count = Number(rule?.questionCount ?? 3)
  const result = await payload.find({ collection: 'questions', where: { course: { equals: relationId(unitResult.course) } }, limit: 1000, depth: 1, overrideAccess: true })
  const questions = (result.docs as unknown as PayloadQuestion[]).map((question) => ({
    id: String(question.id),
    courseId: relationId(question.course),
    categoryId: relationId(question.category),
    type: question.type,
    prompt: question.prompt,
    options: question.options.map((option) => ({ id: option.optionId, label: option.label })),
    correctOptionIds: question.options.filter((option) => option.correct).map((option) => option.optionId),
    explanation: question.explanation ?? '',
    difficulty: question.difficulty ?? 'easy',
  }))
  return questions.slice(0, count)
}

export async function getPayloadUserId(user: AppUser): Promise<PayloadId> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'users', where: { feishuOpenId: { equals: user.id } }, limit: 1, overrideAccess: true })
  return result.docs[0]?.id ?? user.id
}

export { payloadClient }
