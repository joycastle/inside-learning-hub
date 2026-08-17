import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.object({ openId: z.string().min(1), role: z.enum(['employee', 'admin', 'superAdmin']) })

export async function PATCH(request: Request) {
  const actor = await requireAdmin()
  if (actor.role !== 'superAdmin') return NextResponse.json({ message: '只有超级管理员可以修改管理员权限' }, { status: 403 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '权限数据格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'users', where: { feishuOpenId: { equals: parsed.data.openId } }, limit: 1, overrideAccess: true })
  if (!result.docs[0]) return NextResponse.json({ message: '员工尚未登录同步，无法修改权限' }, { status: 404 })
  await payload.update({ collection: 'users', id: result.docs[0].id, data: { role: parsed.data.role }, overrideAccess: true })
  return NextResponse.json({ ok: true })
}
