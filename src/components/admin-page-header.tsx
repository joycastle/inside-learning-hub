import type { ReactNode } from 'react'

export interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow ? <div className="admin-page-eyebrow">{eyebrow}</div> : null}
        <h1 className="admin-page-heading">{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  )
}
