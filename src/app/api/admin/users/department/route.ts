import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.object({ openId: z.string().min(1), departmentId: z.string().min(1), departmentName: z.string().trim().min(1) })

export async function PATCH(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '部门数据格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const userResult = await payload.find({ collection: 'users', where: { feishuOpenId: { equals: parsed.data.openId } }, limit: 1, overrideAccess: true })
  const user = userResult.docs[0]
  if (!user) return NextResponse.json({ message: '员工尚未登录同步，无法修改部门' }, { status: 404 })
  const departmentResult = await payload.find({ collection: 'departments', where: { feishuDepartmentId: { equals: parsed.data.departmentId } }, limit: 1, overrideAccess: true })
  const department = departmentResult.docs[0] ?? await payload.create({ collection: 'departments', data: { name: parsed.data.departmentName, feishuDepartmentId: parsed.data.departmentId, active: true }, overrideAccess: true })
  await payload.update({ collection: 'users', id: user.id, data: { department: department.id }, overrideAccess: true })
  return NextResponse.json({ ok: true, departmentId: department.id, departmentName: parsed.data.departmentName })
}
