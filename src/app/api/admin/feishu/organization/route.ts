import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { demoFeishuOrganization } from '@/lib/demo-data'
import type { FeishuDepartment, FeishuEmployee, FeishuOrganization } from '@/lib/types'

interface FeishuPage<T> {
  code: number
  msg?: string
  data?: {
    items?: T[]
    has_more?: boolean
    page_token?: string
  }
}

interface FeishuDepartmentItem {
  open_department_id?: string
  name?: string
  parent_department_id?: string
}

interface FeishuUserItem {
  open_id?: string
  name?: string
  email?: string
  avatar?: { avatar_72?: string }
  department_ids?: string[]
}

const fetchTenantToken = async (appId: string, appSecret: string) => {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    cache: 'no-store',
  })
  const result = await response.json() as { code: number; msg?: string; tenant_access_token?: string }
  if (!response.ok || result.code !== 0 || !result.tenant_access_token) {
    throw new Error(result.msg ?? '无法获取飞书 tenant_access_token')
  }
  return result.tenant_access_token
}

const fetchAllPages = async <T,>(baseUrl: string, token: string) => {
  const items: T[] = []
  let pageToken = ''
  do {
    const url = new URL(baseUrl)
    if (pageToken) url.searchParams.set('page_token', pageToken)
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const result = await response.json() as FeishuPage<T>
    if (!response.ok || result.code !== 0) throw new Error(result.msg ?? '读取飞书通讯录失败')
    items.push(...(result.data?.items ?? []))
    pageToken = result.data?.has_more ? result.data.page_token ?? '' : ''
  } while (pageToken)
  return items
}

export async function GET() {
  await requireAdmin()
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET

  if (!appId || !appSecret) return NextResponse.json(demoFeishuOrganization)

  try {
    const token = await fetchTenantToken(appId, appSecret)
    const [departmentItems, userItems] = await Promise.all([
      fetchAllPages<FeishuDepartmentItem>(
        'https://open.feishu.cn/open-apis/contact/v3/departments?parent_department_id=0&fetch_child=true&page_size=50&department_id_type=open_department_id',
        token,
      ),
      fetchAllPages<FeishuUserItem>(
        'https://open.feishu.cn/open-apis/contact/v3/users?department_id=0&page_size=100&user_id_type=open_id&department_id_type=open_department_id',
        token,
      ),
    ])

    const departments: FeishuDepartment[] = departmentItems.flatMap((item) => item.open_department_id && item.name ? [{
      id: item.open_department_id,
      name: item.name,
      parentId: item.parent_department_id,
    }] : [])
    const departmentNames = new Map(departments.map((item) => [item.id, item.name]))
    const employees: FeishuEmployee[] = userItems.flatMap((item) => item.open_id && item.name ? [{
      id: item.open_id,
      name: item.name,
      email: item.email,
      avatarUrl: item.avatar?.avatar_72,
      departmentIds: item.department_ids ?? [],
      departmentName: departmentNames.get(item.department_ids?.[0] ?? '') ?? '未分配部门',
    }] : [])
    const organization: FeishuOrganization = {
      source: 'feishu',
      departments,
      employees,
      syncedAt: new Date().toISOString(),
    }
    return NextResponse.json(organization)
  } catch (error) {
    return NextResponse.json({
      ...demoFeishuOrganization,
      warning: error instanceof Error ? error.message : '读取飞书通讯录失败，已使用演示组织数据',
    })
  }
}
