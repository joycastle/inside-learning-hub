import 'server-only'

import { randomBytes } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { AppUser, UserRole } from '@/lib/types'

interface PayloadUserDocument {
  id: string | number
  email: string
  name: string
  englishName?: string | null
  avatarUrl?: string | null
  feishuOpenId?: string | null
  role?: UserRole | null
  active?: boolean | null
  joinedAt?: string | null
  department?: { id: string | number; name?: string | null } | string | number | null
}

const toAppUser = (document: PayloadUserDocument): AppUser => {
  const department = typeof document.department === 'object' && document.department
    ? document.department
    : null
  return {
    id: document.feishuOpenId ?? String(document.id),
    name: document.name,
    englishName: document.englishName ?? undefined,
    email: document.email,
    avatarUrl: document.avatarUrl ?? undefined,
    departmentId: department ? String(department.id) : 'unassigned',
    departmentName: department?.name ?? '待同步部门',
    role: document.role ?? 'employee',
    active: document.active !== false,
    joinedAt: document.joinedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  }
}

export async function findCurrentPayloadUser(feishuOpenId: string): Promise<AppUser | null> {
  if (process.env.DEMO_MODE !== 'false') return null
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'users',
    where: { feishuOpenId: { equals: feishuOpenId } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const document = result.docs[0] as unknown as PayloadUserDocument | undefined
  return document ? toAppUser(document) : null
}

interface SyncFeishuUserInput {
  openId: string
  tenantKey?: string
  name: string
  englishName?: string
  email?: string
  avatarUrl?: string
  bootstrapRole: UserRole
}

/** 幂等同步飞书用户，并通过唯一 assignmentKey 保证默认路径只分配一次。 */
export async function syncFeishuUser(input: SyncFeishuUserInput): Promise<AppUser> {
  const payload = await getPayload({ config })
  const existingResult = await payload.find({
    collection: 'users',
    where: { feishuOpenId: { equals: input.openId } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const existing = existingResult.docs[0] as unknown as PayloadUserDocument | undefined

  const document = existing
    ? await payload.update({
        collection: 'users',
        id: existing.id,
        data: {
          name: input.name,
          englishName: input.englishName,
          avatarUrl: input.avatarUrl,
          tenantKey: input.tenantKey,
          lastSyncedAt: new Date().toISOString(),
        },
        depth: 1,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'users',
        data: {
          email: input.email ?? `${input.openId}@feishu.local`,
          password: randomBytes(32).toString('base64url'),
          name: input.name,
          englishName: input.englishName,
          avatarUrl: input.avatarUrl,
          feishuOpenId: input.openId,
          tenantKey: input.tenantKey,
          role: input.bootstrapRole,
          active: true,
          joinedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
        },
        depth: 1,
        overrideAccess: true,
      })

  if (!existing) {
    const paths = await payload.find({
      collection: 'learning-paths',
      where: { isDefaultOnboarding: { equals: true } },
      limit: 1,
      overrideAccess: true,
    })
    const defaultPath = paths.docs[0]
    if (defaultPath) {
      const assignedAt = new Date()
      const dueAt = new Date(assignedAt)
      const dueDays = Number(defaultPath.defaultDueDays ?? 7)
      dueAt.setDate(dueAt.getDate() + dueDays)
      await payload.create({
        collection: 'enrollments',
        data: {
          user: document.id,
          learningPath: defaultPath.id,
          assignedAt: assignedAt.toISOString(),
          dueAt: dueAt.toISOString(),
          status: 'notStarted',
          assignmentKey: `${document.id}:${defaultPath.id}:default`,
        },
        overrideAccess: true,
      })
    }
  }

  const appUser = toAppUser(document as unknown as PayloadUserDocument)
  if (!appUser.active) throw new Error('当前员工账号已停用')
  return appUser
}

interface FeishuContactObject {
  open_id?: string
  name?: string
  en_name?: string
  email?: string
  enterprise_email?: string
}

/** 消费通讯录 v3 事件；事件 ID 入库去重，员工离职和资料变更会立即反映到权限校验。 */
export async function handleFeishuContactEvent(input: {
  eventId: string
  eventType: string
  tenantKey?: string
  event: Record<string, unknown>
}) {
  const payload = await getPayload({ config })
  const processed = await payload.find({
    collection: 'feishu-events',
    where: { eventId: { equals: input.eventId } },
    limit: 1,
    overrideAccess: true,
  })
  if (processed.docs.length) return { duplicate: true }

  const object = input.event.object as FeishuContactObject | undefined
  const openId = object?.open_id
  if (openId && input.eventType.startsWith('contact.user.')) {
    const users = await payload.find({
      collection: 'users',
      where: { feishuOpenId: { equals: openId } },
      limit: 1,
      overrideAccess: true,
    })
    const user = users.docs[0]
    if (user) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          active: input.eventType !== 'contact.user.deleted_v3',
          name: object?.name ?? user.name,
          englishName: object?.en_name ?? user.englishName,
          email: object?.enterprise_email ?? object?.email ?? user.email,
          tenantKey: input.tenantKey,
          lastSyncedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    }
  }

  await payload.create({
    collection: 'feishu-events',
    data: {
      eventId: input.eventId,
      eventType: input.eventType,
      tenantKey: input.tenantKey,
      payload: input.event,
      processedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  return { duplicate: false }
}
