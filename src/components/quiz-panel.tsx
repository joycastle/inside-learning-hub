'use client'

import { useCallback, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import type { QuizAttemptQuestion, QuizAttemptResult } from '@/lib/types'

interface QuizAttemptPayload {
  attemptId: string
  questions: QuizAttemptQuestion[]
}

export function QuizPanel({ unitId, unlocked }: { unitId: string; unlocked: boolean }) {
  const [attempt, setAttempt] = useState<QuizAttemptPayload | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startAttempt = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/quizzes/${unitId}/attempts`, { method: 'POST' })
      if (!response.ok) throw new Error('暂时无法生成测评，请稍后重试。')
      const payload = (await response.json()) as QuizAttemptPayload
      setAttempt(payload)
      setCurrentIndex(0)
      setAnswers({})
      setResult(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '暂时无法生成测评，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }, [unitId])

  const selectOption = (question: QuizAttemptQuestion, optionId: string) => {
    setAnswers((current) => {
      const selected = current[question.id] ?? []
      if (question.type === 'multiple') {
        return {
          ...current,
          [question.id]: selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId],
        }
      }
      return { ...current, [question.id]: [optionId] }
    })
  }

  const submitAttempt = async () => {
    if (!attempt) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/quiz-attempts/${attempt.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!response.ok) throw new Error('提交失败，答案已保留，请重试。')
      const nextResult = (await response.json()) as QuizAttemptResult
      setResult(nextResult)
      if (nextResult.passed) {
        await fetch(`/api/learning/units/${unitId}/complete`, { method: 'POST' })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '提交失败，答案已保留，请重试。')
    } finally {
      setLoading(false)
    }
  }

  if (!unlocked) {
    return (
      <section className="surface empty-state" aria-labelledby="quiz-locked-title">
        <h2 className="section-heading" id="quiz-locked-title">单元测评尚未解锁</h2>
        <p>完成本单元后，系统会从题库随机抽取题目。</p>
      </section>
    )
  }

  if (!attempt) {
    return (
      <section className="surface quiz-shell" aria-labelledby="quiz-ready-title">
        <h2 className="section-heading" id="quiz-ready-title">单元测评</h2>
        <p className="section-description">系统将随机抽取 3 道题，80 分及以上通过。每次重新尝试会生成新题组。</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button--primary quiz-start-button" type="button" onClick={() => void startAttempt()} disabled={loading}>
          {loading ? '正在生成…' : '开始测评'}<ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    )
  }

  if (result) {
    return (
      <section className="surface quiz-shell quiz-result" aria-live="polite">
        {result.passed ? <CheckCircle2 size={30} strokeWidth={1.6} aria-hidden="true" /> : <AlertCircle size={30} strokeWidth={1.6} aria-hidden="true" />}
        <h2 className="section-heading">{result.passed ? '测评通过' : '继续巩固一下'}</h2>
        <div className="quiz-result__score tabular">{result.score}</div>
        <p className="text-muted">答对 {result.correctCount} / {result.totalCount} 道题</p>
        <div className="quiz-review">
          {result.review.map((item, index) => (
            <div data-correct={item.correct} key={item.questionId}>
              <strong>{index + 1}. {item.correct ? '回答正确' : '回答错误'}</strong>
              <p>{item.explanation}</p>
            </div>
          ))}
        </div>
        <button className="button button--secondary" type="button" onClick={() => void startAttempt()} disabled={loading}>
          <RotateCcw size={16} aria-hidden="true" />重新抽题
        </button>
      </section>
    )
  }

  const question = attempt.questions[currentIndex]
  const selected = answers[question.id] ?? []
  const isLast = currentIndex === attempt.questions.length - 1

  return (
    <section className="surface quiz-shell" aria-labelledby="quiz-question-title">
      <div className="quiz-progress"><span>单元测评</span><span>{currentIndex + 1} / {attempt.questions.length}</span></div>
      <h2 className="quiz-question" id="quiz-question-title">{question.prompt}</h2>
      <div className="quiz-options">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <button
              className="quiz-option"
              data-selected={isSelected}
              type="button"
              key={option.id}
              onClick={() => selectOption(question, option.id)}
              aria-pressed={isSelected}
            >
              <span className="quiz-option__control" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="lesson-footer">
        <button className="button button--quiet" type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>上一题</button>
        {isLast ? (
          <button className="button button--primary" type="button" onClick={() => void submitAttempt()} disabled={!selected.length || loading}>{loading ? '提交中…' : '提交测评'}</button>
        ) : (
          <button className="button button--primary" type="button" onClick={() => setCurrentIndex((index) => index + 1)} disabled={!selected.length}>下一题<ArrowRight size={16} aria-hidden="true" /></button>
        )}
      </div>
    </section>
  )
}
