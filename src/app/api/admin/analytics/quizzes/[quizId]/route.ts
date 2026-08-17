import { NextResponse } from 'next/server'
import { questionBank, trainingRecords } from '@/lib/demo-data'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

export async function GET(_request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  await requireAdmin()
  const { quizId } = await params
  if (process.env.DEMO_MODE === 'false') {
    const payload = await payloadClient()
    const rule = await payload.findByID({ collection: 'quiz-rules', id: quizId, depth: 0, overrideAccess: true }).catch(() => null) as { id?: string | number } | null
    if (!rule) return NextResponse.json({ message: '测评不存在' }, { status: 404 })
    const units = await payload.find({ collection: 'units', where: { quizRule: { equals: rule.id } }, limit: 1000, overrideAccess: true })
    const unitIds = (units.docs as Array<{ id: string | number }>).map((unit) => unit.id)
    if (!unitIds.length) return NextResponse.json({ quizId, participants: 0, passed: 0, passRate: 0, averageScore: 0, questions: [] })
    const attempts = await payload.find({ collection: 'quiz-attempts', where: { unit: { in: unitIds }, submittedAt: { exists: true } }, limit: 1000, overrideAccess: true })
    const docs = attempts.docs as Array<{ score?: number; passed?: boolean; questionSnapshot?: Array<{ id: string; prompt: string; correctOptionIds?: string[] }>; answersSnapshot?: Record<string, string[]> }>
    const scores = docs.map((attempt) => attempt.score).filter((score): score is number => typeof score === 'number')
    const questions = new Map<string, { id: string; prompt: string; answered: number; correct: number }>()
    for (const attempt of docs) for (const question of attempt.questionSnapshot ?? []) {
      const item = questions.get(question.id) ?? { id: question.id, prompt: question.prompt, answered: 0, correct: 0 }
      item.answered += 1
      const answer = attempt.answersSnapshot?.[question.id] ?? []
      if (answer.length === (question.correctOptionIds ?? []).length && answer.every((option) => (question.correctOptionIds ?? []).includes(option))) item.correct += 1
      questions.set(question.id, item)
    }
    return NextResponse.json({ quizId, participants: docs.length, passed: docs.filter((attempt) => attempt.passed).length, passRate: docs.length ? Math.round((docs.filter((attempt) => attempt.passed).length / docs.length) * 100) : 0, averageScore: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0, questions: [...questions.values()].map((question) => ({ ...question, answerCount: question.answered, correctRate: question.answered ? Math.round((question.correct / question.answered) * 100) : 0 })) })
  }
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
