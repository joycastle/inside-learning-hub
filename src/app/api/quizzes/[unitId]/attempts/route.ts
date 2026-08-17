import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { onboardingPath, questionBank } from '@/lib/demo-data'
import { demoAttempts } from '@/lib/demo-store'
import { createQuizAttempt } from '@/lib/quiz-engine'

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
