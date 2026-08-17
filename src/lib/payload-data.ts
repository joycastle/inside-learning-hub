import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import type { Announcement, AppUser, Course, LearningPath, LearningUnit, QuizQuestion, ServiceArticle, TrainingRecord, VideoAnalytics } from '@/lib/types'

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
  media?: Relation<{ id: PayloadId; storageKey?: string | null }> | null
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
  media?: Relation<{ id: PayloadId; storageKey?: string | null }> | null
}

interface PayloadAnnouncement {
  id: PayloadId
  title: string
  summary?: string | null
  audience?: Announcement['audience']
  departments?: Relation[] | null
  startsAt?: string | null
  endsAt?: string | null
  targetUrl?: string | null
  _status?: 'draft' | 'published'
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

// Payload 的集合类型由本地配置生成，业务 Repository 需要同时支持迁移前后的关系形态。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  mediaKey: isDocument(unit.media) ? (unit.media.storageKey ?? undefined) : undefined,
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

export async function getVideoAnalytics(): Promise<VideoAnalytics[]> {
  const payload = await payloadClient()
  const [unitsResult, enrollmentsResult, progressResult] = await Promise.all([
    payload.find({ collection: 'units', where: { type: { equals: 'video' } }, limit: 1000, overrideAccess: true }),
    payload.find({ collection: 'enrollments', depth: 3, limit: 1000, overrideAccess: true }),
    payload.find({ collection: 'video-progress', limit: 1000, overrideAccess: true }),
  ])
  const progress = progressResult.docs as Array<{ unit: Relation; user: Relation; maxProgress?: number; watchedSeconds?: number; lastPlayedAt?: string; completed?: boolean }>
  return (unitsResult.docs as Array<{ id: PayloadId; title: string }>).map((unit) => {
    const assignedUserIds = new Set<string>()
    for (const enrollment of enrollmentsResult.docs as Array<{ user: Relation; learningPath?: Relation<PayloadPath> }>) {
      const path = isDocument(enrollment.learningPath) ? enrollment.learningPath as PayloadPath : null
      const includesUnit = path?.courses?.some((course) => {
        const resolvedCourse = isDocument(course) ? course as PayloadCourse : null
        return Boolean(resolvedCourse?.units?.some((candidate) => relationId(candidate) === String(unit.id)))
      })
      if (includesUnit) assignedUserIds.add(relationId(enrollment.user))
    }
    const unitProgress = progress.filter((item) => relationId(item.unit) === String(unit.id))
    const started = unitProgress.filter((item) => (item.maxProgress ?? 0) > 0)
    const completed = unitProgress.filter((item) => item.completed || (item.maxProgress ?? 0) >= 90)
    const latest = unitProgress.map((item) => item.lastPlayedAt).filter((value): value is string => Boolean(value)).sort().at(-1)
    const bucketRanges = [[0, 10], [10, 25], [25, 50], [50, 75], [75, 90], [90, 101]] as const
    const buckets = bucketRanges.map(([min, max], index) => ({
      label: ['0–10%', '10–25%', '25–50%', '50–75%', '75–90%', '90–100%'][index],
      value: unitProgress.filter((item) => {
        const value = item.maxProgress ?? 0
        return index === 0 ? value >= min && value <= max : value > min && value < max
      }).length,
    }))
    return {
      id: String(unit.id),
      title: unit.title,
      assigned: assignedUserIds.size,
      started: started.length,
      completed: completed.length,
      averageWatchMinutes: unitProgress.length ? Math.round((unitProgress.reduce((sum, item) => sum + (item.watchedSeconds ?? 0), 0) / unitProgress.length / 60) * 10) / 10 : 0,
      averageProgress: unitProgress.length ? Math.round(unitProgress.reduce((sum, item) => sum + (item.maxProgress ?? 0), 0) / unitProgress.length) : 0,
      lastWatchedAt: latest ?? new Date(0).toISOString(),
      buckets,
    }
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
      mediaKey: isDocument(article.media) ? (article.media.storageKey ?? undefined) : undefined,
      tags: (article.tags ?? []).map((tag) => tag.label),
      source: article.source ?? undefined,
      sections: article.bodyText ? [{ title: '正文', paragraphs: article.bodyText.split(/\n+/).filter(Boolean) }] : undefined,
    }
  })
}

export async function getAnnouncementsForUser(user: AppUser): Promise<Announcement[]> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'announcements', depth: 2, limit: 1000, sort: '-createdAt', overrideAccess: true })
  const now = Date.now()
  const joinedAt = new Date(user.joinedAt).getTime()
  const departmentResult = user.departmentId
    ? await payload.find({ collection: 'departments', where: { feishuDepartmentId: { equals: user.departmentId } }, limit: 1, overrideAccess: true })
    : { docs: [] }
  const payloadDepartmentId = departmentResult.docs[0]?.id
  return (result.docs as unknown as PayloadAnnouncement[]).filter((announcement) => {
    if (announcement._status === 'draft') return false
    if (announcement.startsAt && new Date(announcement.startsAt).getTime() > now) return false
    if (announcement.endsAt && new Date(announcement.endsAt).getTime() < now) return false
    if (announcement.audience === 'newEmployees' && (!Number.isFinite(joinedAt) || now - joinedAt > 30 * 86400000)) return false
    if (announcement.audience === 'departments' && !announcement.departments?.some((department) => relationId(department) === String(payloadDepartmentId))) return false
    return true
  }).map((announcement) => ({
    id: String(announcement.id),
    title: announcement.title,
    summary: announcement.summary ?? undefined,
    audience: announcement.audience ?? 'all',
    startsAt: announcement.startsAt ?? undefined,
    endsAt: announcement.endsAt ?? undefined,
    targetUrl: announcement.targetUrl ?? undefined,
  }))
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

/**
 * 业务 API 必须先确认单元属于当前员工的有效分配，再允许写入学习数据。
 * 这层校验不能依赖客户端传入的 userId，也不能只依赖 unitId 的格式。
 */
export async function canUserAccessUnit(user: AppUser, unitId: string): Promise<boolean> {
  const payload = await payloadClient()
  const payloadUserId = await getPayloadUserId(user)
  const enrollments = await payload.find({
    collection: 'enrollments',
    where: { user: { equals: payloadUserId } },
    depth: 3,
    limit: 1000,
    overrideAccess: true,
  })
  return (enrollments.docs as Array<{ learningPath?: Relation<PayloadPath> }>).some((enrollment) => {
    const path = isDocument(enrollment.learningPath) ? enrollment.learningPath as PayloadPath : null
    return Boolean(path?.courses?.some((course) => {
      const resolvedCourse = isDocument(course) ? course as PayloadCourse : null
      return Boolean(resolvedCourse?.units?.some((unit) => relationId(unit) === unitId))
    }))
  })
}

export async function canUserAccessMedia(user: AppUser, storageKey: string): Promise<boolean> {
  const payload = await payloadClient()
  const media = await payload.find({
    collection: 'media',
    where: { storageKey: { equals: storageKey } },
    limit: 1,
    overrideAccess: true,
  })
  const mediaId = media.docs[0]?.id
  if (!mediaId) return false
  const units = await payload.find({ collection: 'units', where: { media: { equals: mediaId } }, limit: 1000, overrideAccess: true })
  const articles = await payload.find({ collection: 'knowledge-articles', where: { media: { equals: mediaId }, status: { equals: 'published' } }, limit: 1000, overrideAccess: true })
  for (const unit of units.docs as Array<{ id: PayloadId }>) {
    if (await canUserAccessUnit(user, String(unit.id))) return true
  }
  return articles.docs.length > 0
}

export async function getAdminFeishuOpenIds(): Promise<string[]> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'users', where: { role: { in: ['admin', 'superAdmin'] } }, limit: 1000, overrideAccess: true })
  return (result.docs as Array<{ feishuOpenId?: string }>).map((user) => user.feishuOpenId).filter((id): id is string => Boolean(id))
}

export { payloadClient }
