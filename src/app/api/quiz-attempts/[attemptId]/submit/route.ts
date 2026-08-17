import { z } from 'zod'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoAttempts } from '@/lib/demo-store'
import { scoreQuizAttempt } from '@/lib/quiz-engine'
import { getPayloadUserId, payloadClient } from '@/lib/payload-data'

const submitSchema = z.object({ answers: z.record(z.string(), z.array(z.string())) })

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser()
  const { attemptId } = await params
  if (process.env.DEMO_MODE === 'false') {
    const parsed = submitSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ message: '答案格式错误' }, { status: 400 })
    const payload = await payloadClient()
    const payloadUserId = await getPayloadUserId(user)
    const attempt = await payload.findByID({ collection: 'quiz-attempts', id: attemptId, overrideAccess: true }) as { id: string | number; user: string | number | { id: string | number }; questionSnapshot: Parameters<typeof scoreQuizAttempt>[0]; submittedAt?: string; score?: number; passed?: boolean }
    if (!attempt || String(typeof attempt.user === 'object' ? attempt.user.id : attempt.user) !== String(payloadUserId)) {
      return NextResponse.json({ message: '测评记录不存在' }, { status: 404 })
    }
    if (attempt.submittedAt && typeof attempt.score === 'number') return NextResponse.json({ score: attempt.score, passed: attempt.passed, correctCount: 0, totalCount: attempt.questionSnapshot.length, answers: parsed.data.answers, review: [] })
    const result = scoreQuizAttempt(attempt.questionSnapshot, parsed.data.answers)
    await payload.update({ collection: 'quiz-attempts', id: attempt.id, data: { answersSnapshot: parsed.data.answers, score: result.score, passed: result.passed, submittedAt: new Date().toISOString() }, overrideAccess: true })
    return NextResponse.json(result)
  }
  const attempt = demoAttempts.get(attemptId)
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ message: '测评记录不存在' }, { status: 404 })
  }
  if (attempt.submitted && attempt.result) return NextResponse.json(attempt.result)

  const parsed = submitSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '答案格式错误' }, { status: 400 })

  const result = scoreQuizAttempt(attempt.questions, parsed.data.answers)
  attempt.submitted = true
  attempt.result = result
  demoAttempts.set(attemptId, attempt)
  return NextResponse.json(result)
}
