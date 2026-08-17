import type { Access, CollectionConfig, FieldAccess } from 'payload'

type PayloadUser = { id: string | number; role?: 'employee' | 'admin' | 'superAdmin' }

const adminOnly: Access = ({ req }) => {
  const user = req.user as PayloadUser | null
  return user?.role === 'admin' || user?.role === 'superAdmin'
}

const superAdminOnly: Access = ({ req }) => (req.user as PayloadUser | null)?.role === 'superAdmin'
const superAdminFieldOnly: FieldAccess = ({ req }) => (req.user as PayloadUser | null)?.role === 'superAdmin'
const adminFieldOnly: FieldAccess = ({ req }) => {
  const role = (req.user as PayloadUser | null)?.role
  return role === 'admin' || role === 'superAdmin'
}
const ownsUserRelation: Access = ({ req, data }) => {
  const user = req.user as PayloadUser | null
  if (!user) return false
  if (user.role === 'admin' || user.role === 'superAdmin') return true
  const value = (data as { user?: string | number | { id: string | number } } | undefined)?.user
  const id = typeof value === 'object' && value !== null ? value.id : value
  return id !== undefined && String(id) === String(user.id)
}

const adminOrSelf: Access = ({ req }) => {
  const user = req.user as PayloadUser | null
  if (!user) return false
  if (user.role === 'admin' || user.role === 'superAdmin') return true
  return { id: { equals: user.id } }
}

const slugField = { name: 'slug', type: 'text', required: true, unique: true, index: true } as const
const titleField = { name: 'title', type: 'text', required: true } as const
const publishedVersions = { drafts: { autosave: true }, maxPerDoc: 20 } as const

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'name' },
  access: { read: adminOrSelf, create: superAdminOnly, update: adminOrSelf, delete: superAdminOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'englishName', type: 'text' },
    { name: 'avatarUrl', type: 'text' },
    { name: 'feishuOpenId', type: 'text', unique: true, index: true, access: { update: superAdminFieldOnly } },
    { name: 'tenantKey', type: 'text', index: true, access: { update: superAdminFieldOnly } },
    { name: 'department', type: 'relationship', relationTo: 'departments', access: { update: adminFieldOnly } },
    { name: 'role', type: 'select', required: true, defaultValue: 'employee', options: ['employee', 'admin', 'superAdmin'], access: { update: superAdminFieldOnly } },
    { name: 'active', type: 'checkbox', defaultValue: true, required: true, access: { update: adminFieldOnly } },
    { name: 'joinedAt', type: 'date' },
    { name: 'lastSyncedAt', type: 'date', access: { update: superAdminFieldOnly } },
  ],
}

export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: { useAsTitle: 'name' },
  access: { read: () => true, create: adminOnly, update: adminOnly, delete: superAdminOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'feishuDepartmentId', type: 'text', unique: true, index: true },
    { name: 'parent', type: 'relationship', relationTo: 'departments' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  upload: { mimeTypes: ['text/html', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'image/*'], staticDir: 'media' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'storageKey', type: 'text', unique: true, index: true },
    { name: 'durationSeconds', type: 'number', min: 0 },
    { name: 'private', type: 'checkbox', defaultValue: true },
  ],
}

export const LearningPaths: CollectionConfig = {
  slug: 'learning-paths',
  admin: { useAsTitle: 'title' },
  versions: publishedVersions,
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    titleField,
    slugField,
    { name: 'summary', type: 'textarea', required: true },
    { name: 'defaultDueDays', type: 'number', defaultValue: 7, min: 1, required: true },
    { name: 'isDefaultOnboarding', type: 'checkbox', defaultValue: false },
    { name: 'courses', type: 'relationship', relationTo: 'courses', hasMany: true },
  ],
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: { useAsTitle: 'title' },
  versions: publishedVersions,
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    titleField,
    slugField,
    { name: 'path', type: 'relationship', relationTo: 'learning-paths', required: true, index: true },
    { name: 'order', type: 'number', min: 0, defaultValue: 0 },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'category', type: 'text', required: true },
    { name: 'durationMinutes', type: 'number', min: 0 },
    { name: 'units', type: 'relationship', relationTo: 'units', hasMany: true },
  ],
}

export const Units: CollectionConfig = {
  slug: 'units',
  admin: { useAsTitle: 'title' },
  versions: publishedVersions,
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    titleField,
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'order', type: 'number', min: 0, defaultValue: 0 },
    { name: 'description', type: 'textarea', required: true },
    { name: 'type', type: 'select', required: true, options: ['article', 'pdf', 'feishuDoc', 'video', 'html'] },
    { name: 'durationMinutes', type: 'number', min: 0 },
    { name: 'body', type: 'richText' },
    { name: 'media', type: 'relationship', relationTo: 'media' },
    { name: 'externalUrl', type: 'text' },
    { name: 'quizRule', type: 'relationship', relationTo: 'quiz-rules' },
  ],
}

export const QuestionCategories: CollectionConfig = {
  slug: 'question-categories',
  admin: { useAsTitle: 'name' },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [{ name: 'name', type: 'text', required: true }, { name: 'description', type: 'textarea' }],
}

export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: { useAsTitle: 'prompt' },
  versions: { maxPerDoc: 20 },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'category', type: 'relationship', relationTo: 'question-categories', required: true },
    { name: 'type', type: 'select', required: true, options: ['single', 'multiple', 'trueFalse'] },
    { name: 'prompt', type: 'textarea', required: true },
    { name: 'options', type: 'array', minRows: 2, required: true, fields: [{ name: 'optionId', type: 'text', required: true }, { name: 'label', type: 'text', required: true }, { name: 'correct', type: 'checkbox', defaultValue: false }] },
    { name: 'explanation', type: 'textarea', required: true },
    { name: 'difficulty', type: 'select', defaultValue: 'easy', options: ['easy', 'medium', 'hard'] },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'status', type: 'select', defaultValue: 'published', options: ['draft', 'published'] },
  ],
}

export const QuizRules: CollectionConfig = {
  slug: 'quiz-rules',
  admin: { useAsTitle: 'name' },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'categories', type: 'relationship', relationTo: 'question-categories', hasMany: true, required: true },
    { name: 'questionCount', type: 'number', defaultValue: 3, min: 1, required: true },
    { name: 'passScore', type: 'number', defaultValue: 80, min: 0, max: 100, required: true },
  ],
}

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'learningPath', type: 'relationship', relationTo: 'learning-paths', required: true, index: true },
    { name: 'assignedAt', type: 'date', required: true },
    { name: 'dueAt', type: 'date', required: true, index: true },
    { name: 'status', type: 'select', defaultValue: 'notStarted', options: ['notStarted', 'inProgress', 'completed', 'overdue'], index: true },
    { name: 'completedAt', type: 'date' },
    { name: 'assignmentKey', type: 'text', required: true, unique: true, index: true },
  ],
}

export const UnitProgress: CollectionConfig = {
  slug: 'unit-progress',
  access: { read: adminOnly, create: ownsUserRelation, update: ownsUserRelation, delete: adminOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'unit', type: 'relationship', relationTo: 'units', required: true, index: true },
    { name: 'status', type: 'select', defaultValue: 'notStarted', options: ['notStarted', 'inProgress', 'completed'] },
    { name: 'progress', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { name: 'completedAt', type: 'date' },
    { name: 'progressKey', type: 'text', required: true, unique: true, index: true },
  ],
}

export const VideoProgress: CollectionConfig = {
  slug: 'video-progress',
  access: { read: adminOnly, create: ownsUserRelation, update: ownsUserRelation, delete: adminOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'unit', type: 'relationship', relationTo: 'units', required: true, index: true },
    { name: 'firstPlayedAt', type: 'date' },
    { name: 'lastPlayedAt', type: 'date', index: true },
    { name: 'currentSeconds', type: 'number', min: 0 },
    { name: 'maxSeconds', type: 'number', min: 0 },
    { name: 'watchedSeconds', type: 'number', min: 0 },
    { name: 'maxProgress', type: 'number', min: 0, max: 100, index: true },
    { name: 'completed', type: 'checkbox', defaultValue: false, index: true },
    { name: 'completedAt', type: 'date' },
    { name: 'progressKey', type: 'text', required: true, unique: true, index: true },
  ],
}

export const VideoPlaybackSessions: CollectionConfig = {
  slug: 'video-playback-sessions',
  admin: { hidden: true },
  access: { read: adminOnly, create: ownsUserRelation, update: ownsUserRelation, delete: adminOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'unit', type: 'relationship', relationTo: 'units', required: true, index: true },
    { name: 'sessionId', type: 'text', required: true, index: true },
    { name: 'lastSequence', type: 'number', required: true, min: 0 },
    { name: 'lastReportedAt', type: 'date', required: true },
  ],
}

export const QuizAttempts: CollectionConfig = {
  slug: 'quiz-attempts',
  access: { read: adminOnly, create: ownsUserRelation, update: ownsUserRelation, delete: adminOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'unit', type: 'relationship', relationTo: 'units', required: true, index: true },
    { name: 'questionSnapshot', type: 'json', required: true },
    { name: 'answersSnapshot', type: 'json' },
    { name: 'score', type: 'number', min: 0, max: 100 },
    { name: 'passed', type: 'checkbox' },
    { name: 'startedAt', type: 'date', required: true },
    { name: 'submittedAt', type: 'date' },
  ],
}

export const QuizAttemptItems: CollectionConfig = {
  slug: 'quiz-attempt-items',
  admin: { hidden: true },
  access: { read: adminOnly, create: ({ req }) => Boolean(req.user), update: () => false, delete: adminOnly },
  fields: [
    { name: 'attempt', type: 'relationship', relationTo: 'quiz-attempts', required: true, index: true },
    { name: 'questionId', type: 'text', required: true },
    { name: 'questionSnapshot', type: 'json', required: true },
    { name: 'selectedOptionIds', type: 'json', required: true },
    { name: 'correct', type: 'checkbox', required: true },
  ],
}

export const ServiceCategories: CollectionConfig = {
  slug: 'service-categories',
  admin: { useAsTitle: 'name' },
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [{ name: 'name', type: 'text', required: true }, slugField, { name: 'order', type: 'number', min: 0 }],
}

export const KnowledgeArticles: CollectionConfig = {
  slug: 'knowledge-articles',
  admin: { useAsTitle: 'title' },
  versions: publishedVersions,
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    titleField,
    slugField,
    { name: 'summary', type: 'textarea', required: true },
    { name: 'type', type: 'select', defaultValue: 'article', options: ['article', 'pdf', 'feishuDoc', 'externalLink'] },
    { name: 'bodyText', type: 'textarea' },
    { name: 'source', type: 'text' },
    { name: 'status', type: 'select', defaultValue: 'published', options: ['draft', 'published'] },
    { name: 'category', type: 'relationship', relationTo: 'service-categories', required: true },
    { name: 'body', type: 'richText' },
    { name: 'media', type: 'relationship', relationTo: 'media' },
    { name: 'externalUrl', type: 'text' },
    { name: 'tags', type: 'array', fields: [{ name: 'label', type: 'text', required: true }] },
  ],
}

export const ServiceLinks: CollectionConfig = {
  slug: 'service-links',
  admin: { useAsTitle: 'title' },
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [titleField, { name: 'category', type: 'relationship', relationTo: 'service-categories' }, { name: 'url', type: 'text', required: true }, { name: 'order', type: 'number', min: 0 }],
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: { useAsTitle: 'title' },
  versions: publishedVersions,
  access: { read: ({ req }) => Boolean(req.user), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    titleField,
    { name: 'summary', type: 'textarea' },
    { name: 'audience', type: 'select', defaultValue: 'all', options: ['all', 'newEmployees', 'departments'] },
    { name: 'departments', type: 'relationship', relationTo: 'departments', hasMany: true },
    { name: 'startsAt', type: 'date' },
    { name: 'endsAt', type: 'date' },
    { name: 'targetUrl', type: 'text' },
  ],
}

export const FeishuEvents: CollectionConfig = {
  slug: 'feishu-events',
  admin: { hidden: true },
  access: { read: superAdminOnly, create: () => false, update: () => false, delete: superAdminOnly },
  fields: [
    { name: 'eventId', type: 'text', required: true, unique: true, index: true },
    { name: 'eventType', type: 'text', required: true, index: true },
    { name: 'tenantKey', type: 'text', index: true },
    { name: 'payload', type: 'json', required: true },
    { name: 'processedAt', type: 'date', required: true },
  ],
}

export const collections: CollectionConfig[] = [
  Users, Departments, Media, LearningPaths, Courses, Units, QuestionCategories, Questions, QuizRules,
  Enrollments, UnitProgress, VideoProgress, VideoPlaybackSessions, QuizAttempts, QuizAttemptItems,
  ServiceCategories, KnowledgeArticles, ServiceLinks, Announcements, FeishuEvents,
]
