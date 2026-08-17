import { NextResponse } from 'next/server'
import { trainingRecords } from '@/lib/demo-data'
import { requireAdmin } from '@/lib/auth'
import { getTrainingRecords } from '@/lib/payload-data'

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin()
  const { userId } = await params
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  const record = records.find((item) => item.userId === userId)
  return record
    ? NextResponse.json({ ...record, unitProgress: [], quizAttempts: [] })
    : NextResponse.json({ message: '员工学习记录不存在' }, { status: 404 })
}
