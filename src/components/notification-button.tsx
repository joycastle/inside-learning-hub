'use client'

import { Bell, X } from 'lucide-react'
import { useState } from 'react'
import type { Announcement } from '@/lib/types'

export function NotificationButton({ announcements }: { announcements: Announcement[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="notification-control">
      <button className="icon-button" type="button" aria-label="通知" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open ? <div className="notification-popover" role="dialog" aria-label="通知"><div><strong>通知</strong><button type="button" className="icon-button" aria-label="关闭通知" onClick={() => setOpen(false)}><X size={15} aria-hidden="true" /></button></div>{announcements.length ? <ul>{announcements.slice(0, 5).map((announcement) => <li key={announcement.id}>{announcement.targetUrl ? <a href={announcement.targetUrl} target={announcement.targetUrl.startsWith('http') ? '_blank' : undefined} rel={announcement.targetUrl.startsWith('http') ? 'noreferrer' : undefined} onClick={() => setOpen(false)}><strong>{announcement.title}</strong>{announcement.summary ? <small>{announcement.summary}</small> : null}</a> : <div><strong>{announcement.title}</strong>{announcement.summary ? <small>{announcement.summary}</small> : null}</div>}</li>)}</ul> : <p>暂无新通知</p>}</div> : null}
    </div>
  )
}
