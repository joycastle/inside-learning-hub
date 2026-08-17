import { NextResponse } from 'next/server'
import { handleFeishuContactEvent } from '@/lib/payload-user'

interface FeishuEventPayload {
  challenge?: string
  token?: string
  header?: { event_id?: string; event_type?: string; tenant_key?: string; token?: string }
  event?: Record<string, unknown>
}

export async function POST(request: Request) {
  const payload = (await request.json()) as FeishuEventPayload
  const verificationToken = process.env.FEISHU_VERIFICATION_TOKEN
  if (verificationToken && (payload.header?.token ?? payload.token) !== verificationToken) {
    return NextResponse.json({ message: '无效的飞书事件凭证' }, { status: 401 })
  }
  if (payload.challenge) return NextResponse.json({ challenge: payload.challenge })

  const allowedTenantKeys = new Set(
    (process.env.FEISHU_ALLOWED_TENANT_KEYS ?? process.env.FEISHU_TENANT_KEY ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
  if (allowedTenantKeys.size && (!payload.header?.tenant_key || !allowedTenantKeys.has(payload.header.tenant_key))) {
    return NextResponse.json({ message: '事件租户不属于当前企业' }, { status: 403 })
  }

  if (process.env.DEMO_MODE === 'false' && payload.header?.event_id && payload.header.event_type && payload.event) {
    await handleFeishuContactEvent({
      eventId: payload.header.event_id,
      eventType: payload.header.event_type,
      tenantKey: payload.header.tenant_key,
      event: payload.event,
    })
  }
  return new NextResponse(null, { status: 204 })
}
