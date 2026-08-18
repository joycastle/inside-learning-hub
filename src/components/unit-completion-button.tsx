'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export function UnitCompletionButton({ unitId, completed }: { unitId: string; completed: boolean }) {
  const [done, setDone] = useState(completed)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (done) return <p className="unit-completion-status"><CheckCircle2 size={16} aria-hidden="true" />已完成本单元</p>

  const complete = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/v1/learning/units/${unitId}/complete`, { method: 'POST', headers: { Origin: window.location.origin } })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? '完成单元失败，请稍后重试。')
      }
      setDone(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '完成单元失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return <div className="unit-completion-action"><button className="button button--secondary" type="button" onClick={() => void complete()} disabled={saving}>{saving ? '保存中…' : '标记为已完成'}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}</div>
}
