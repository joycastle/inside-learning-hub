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

  const complete = async () => {
    setLoading(true)
    const response = await fetch(`/api/learning/units/${unitId}/complete`, { method: 'POST' })
    if (response.ok) setCompleted(true)
    setLoading(false)
  }

  return completed ? (
    <span className="unit-complete-state"><CheckCircle2 size={17} aria-hidden="true" />本单元已完成</span>
  ) : (
    <button className="button button--primary" type="button" onClick={() => void complete()} disabled={loading}>
      {loading ? '正在保存…' : '标记为已完成'}
    </button>
  )
}
