import { describe, expect, it } from 'vitest'
import { questionBank } from '@/lib/demo-data'
import { createQuizAttempt, scoreQuizAttempt } from '@/lib/quiz-engine'

describe('quiz engine', () => {
  it('draws unique questions and removes answers from the client snapshot', () => {
    const attempt = createQuizAttempt(questionBank, 3, () => 0.42)
    expect(new Set(attempt.map((question) => question.id)).size).toBe(3)
    attempt.forEach((question) => expect(question.correctOptionIds).toBeUndefined())
  })

  it('scores multiple choice by exact option set and returns explanations', () => {
    const questions = questionBank.slice(0, 3)
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.correctOptionIds]))
    const result = scoreQuizAttempt(questions, answers)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.review.every((item) => item.correct)).toBe(true)
    expect(result.review[0].explanation.length).toBeGreaterThan(0)
  })
})
