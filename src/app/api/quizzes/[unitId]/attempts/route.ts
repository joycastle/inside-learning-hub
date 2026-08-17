import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { onboardingPath, questionBank } from '@/lib/demo-data'
import { demoAttempts } from '@/lib/demo-store'
import { createQuizAttempt } from '@/lib/quiz-engine'
import { getPayloadUserId, getQuestionsForUnit, payloadClient } from '@/lib/payload-data'

export async function POST(_request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const user = await requireUser()
  const { unitId } = await params
  const existing = [...demoAttempts.values()].find(
    (attempt) => attempt.userId === user.id && attempt.unitId === unitId && !attempt.submitted,
  )
  if (existing) {
    return NextResponse.json({
      attemptId: existing.id,
      questions: existing.questions.map(({ correctOptionIds, ...question }) => {
        void correctOptionIds
        return question
      }),
    })
  }

  const course = onboardingPath.courses.find((item) => item.units.some((unit) => unit.id === unitId))
  if (process.env.DEMO_MODE === 'false') {
    const courseQuestions = await getQuestionsForUnit(unitId)
    if (courseQuestions.length < 3) return NextResponse.json({ message: '当前课程题库题目不足' }, { status: 409 })
    const selected = createQuizAttempt(courseQuestions, 3)
    const payload = await payloadClient()
    const payloadUserId = await getPayloadUserId(user)
    const existing = await payload.find({ collection: 'quiz-attempts', where: { and: [{ user: { equals: payloadUserId } }, { unit: { equals: unitId } }, { submittedAt: { exists: false } }] }, limit: 1, overrideAccess: true })
    if (existing.docs[0]) {
      const stored = existing.docs[0] as { id: string | number; questionSnapshot: Array<typeof selected[number] & { correctOptionIds?: string[] }> }
      const questions = stored.questionSnapshot.map(({ correctOptionIds, ...question }) => {
        void correctOptionIds
        return question
      })
      return NextResponse.json({ attemptId: String(stored.id), questions })
    }
    const storedQuestions = selected.map((question) => ({ ...question, correctOptionIds: [...(courseQuestions.find((item) => item.id === question.id)?.correctOptionIds ?? [])] }))
    const attempt = await payload.create({ collection: 'quiz-attempts', data: { user: payloadUserId, unit: unitId, questionSnapshot: storedQuestions, startedAt: new Date().toISOString() }, overrideAccess: true })
    return NextResponse.json({ attemptId: String(attempt.id), questions: selected }, { status: 201 })
  }

  if (!course) return NextResponse.json({ message: '未找到该学习单元所属课程' }, { status: 404 })
  const courseQuestions = questionBank.filter((question) => question.courseId === course.id)
  if (courseQuestions.length < 3) return NextResponse.json({ message: '当前课程题库题目不足' }, { status: 409 })

  const selected = createQuizAttempt(courseQuestions, 3)
  const storedQuestions = selected.map((question) => {
    const source = courseQuestions.find((item) => item.id === question.id)
    if (!source) throw new Error('题目快照生成失败')
    return { ...question, correctOptionIds: [...source.correctOptionIds] }
  })
  const attemptId = randomUUID()
  demoAttempts.set(attemptId, {
    id: attemptId,
    userId: user.id,
    unitId,
    questions: storedQuestions,
    submitted: false,
  })
  return NextResponse.json({ attemptId, questions: selected }, { status: 201 })
}
