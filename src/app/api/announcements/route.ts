import { NextResponse } from 'next/server'
import { getAnnouncements } from '@/lib/api/server'

export async function GET() {
  return NextResponse.json({ items: await getAnnouncements() })
}
