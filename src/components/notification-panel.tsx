'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'

type Announcement = { id: string | number; title: string; summary: string; targetUrl?: string }

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Announcement[] | null>(null)
  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && !items) {
      const response = await fetch('/api/announcements', { cache: 'no-store' })
      if (response.ok) setItems((await response.json() as { items: Announcement[] }).items)
    }
  }
  return <div className="notification-control"><button className="icon-button" type="button" aria-label="通知" aria-expanded={open} onClick={() => void toggle()}><Bell size={19} strokeWidth={1.8} aria-hidden="true" /></button>{open ? <div className="notification-popover" role="dialog" aria-label="通知面板"><strong>通知</strong>{items === null ? <p>加载中…</p> : items.length ? <ul>{items.map((item) => <li key={item.id}>{item.targetUrl ? <a href={item.targetUrl}>{item.title}</a> : <div><strong>{item.title}</strong></div>}<small>{item.summary}</small></li>)}</ul> : <p>暂无新公告</p>}</div> : null}</div>
}
