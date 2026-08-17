import { statusLabel } from '@/lib/format'
import type { LearningStatus } from '@/lib/types'

export interface StatusBadgeProps {
  status: LearningStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabel[status]}</span>
}
