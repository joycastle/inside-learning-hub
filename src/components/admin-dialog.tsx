'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface AdminDialogProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'medium' | 'large'
  density?: 'default' | 'compact'
}

export function AdminDialog({ open, title, description, onClose, children, footer, size = 'medium', density = 'default' }: AdminDialogProps) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose()
    }}>
      <section className="admin-dialog" data-size={size} data-density={density} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
        <header className="admin-dialog__header">
          <div>
            <h2 id="admin-dialog-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="admin-dialog__close" type="button" aria-label="关闭" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="admin-dialog__body">{children}</div>
        {footer ? <footer className="admin-dialog__footer">{footer}</footer> : null}
      </section>
    </div>
  )
}
