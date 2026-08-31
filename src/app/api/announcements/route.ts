import { NextResponse } from 'next/server'
import { ApiClientError, getAnnouncements } from '@/lib/api/server'

export async function GET() {
  try {
    return NextResponse.json({ items: await getAnnouncements() })
  } catch (error) {
    if (error instanceof ApiClientError) {
      return NextResponse.json({ code: error.code ?? 'API_ERROR', message: error.message }, { status: error.status })
    }
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: '公告服务暂时不可用' }, { status: 500 })
  }
}
