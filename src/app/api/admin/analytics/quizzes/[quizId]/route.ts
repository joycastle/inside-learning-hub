import { NextResponse } from 'next/server'
import { questionBank, trainingRecords } from '@/lib/demo-data'
import { requireAdmin } from '@/lib/auth'

export async function GET(_request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  await requireAdmin()
  const { quizId } = await params
  const attempts = trainingRecords.filter((record) => record.attempts > 0)
  const passed = attempts.filter((record) => (record.bestScore ?? 0) >= 80)
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((total, record) => total + (record.bestScore ?? 0), 0) / attempts.length)
    : 0
  return NextResponse.json({
    quizId,
    participants: attempts.length,
    passed: passed.length,
    passRate: attempts.length ? Math.round((passed.length / attempts.length) * 100) : 0,
    averageScore,
    questions: questionBank.map((question, index) => ({
      id: question.id,
      prompt: question.prompt,
      answerCount: attempts.length,
      correctRate: [86, 72, 91, 68][index],
    })),
  })
}
