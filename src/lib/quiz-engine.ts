import type { QuizAttemptQuestion, QuizAttemptResult, QuizQuestion } from '@/lib/types'

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export const createQuizAttempt = (
  questions: QuizQuestion[],
  count: number,
  random: () => number = Math.random,
): QuizAttemptQuestion[] => {
  if (questions.length < count) {
    throw new Error(`题库至少需要 ${count} 道可用题目，当前只有 ${questions.length} 道`)
  }

  return shuffle(questions, random)
    .slice(0, count)
    .map(({ correctOptionIds, ...question }) => {
      void correctOptionIds
      return { ...question, options: shuffle(question.options, random) }
    })
}

const sameAnswer = (answer: string[], expected: string[]) => {
  const actualSet = new Set(answer)
  return actualSet.size === expected.length && expected.every((optionId) => actualSet.has(optionId))
}

export const scoreQuizAttempt = (
  questions: QuizQuestion[],
  answers: Record<string, string[]>,
  passScore = 80,
): QuizAttemptResult => {
  const correctCount = questions.reduce(
    (total, question) =>
      total + (sameAnswer(answers[question.id] ?? [], question.correctOptionIds) ? 1 : 0),
    0,
  )
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100)

  return {
    score,
    passed: score >= passScore,
    correctCount,
    totalCount: questions.length,
    answers,
    review: questions.map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      selectedOptionIds: answers[question.id] ?? [],
      correctOptionIds: question.correctOptionIds,
      correct: sameAnswer(answers[question.id] ?? [], question.correctOptionIds),
      explanation: question.explanation,
    })),
  }
}
