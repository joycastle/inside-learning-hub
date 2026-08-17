import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { cleanupExpiredMedia } from '@/lib/media-retention'

export async function POST() {
  await requireAdmin()
  return NextResponse.json(await cleanupExpiredMedia())
}
