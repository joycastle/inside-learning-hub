'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export interface CompleteUnitButtonProps {
  unitId: string
  initiallyCompleted?: boolean
}

export function CompleteUnitButton({ unitId, initiallyCompleted = false }: CompleteUnitButtonProps) {
  const [completed, setCompleted] = useState(initiallyCompleted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const complete = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/learning/units/${unitId}/complete`, { method: 'POST' })
      if (!response.ok) throw new Error('保存失败，请重试。')
      setCompleted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败，请重试。')
    } finally {
      setLoading(false)
    }
  }

  return completed ? (
    <span className="unit-complete-state"><CheckCircle2 size={17} aria-hidden="true" />本单元已完成</span>
  ) : (
    <>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button--primary" type="button" onClick={() => void complete()} disabled={loading}>
        {loading ? '正在保存…' : '标记为已完成'}
      </button>
    </>
  )
}
