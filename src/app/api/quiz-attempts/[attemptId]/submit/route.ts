import { z } from 'zod'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { demoAttempts } from '@/lib/demo-store'
import { scoreQuizAttempt } from '@/lib/quiz-engine'

const submitSchema = z.object({ answers: z.record(z.string(), z.array(z.string())) })

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser()
  const { attemptId } = await params
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
