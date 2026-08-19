'use client'

import {
  BookOpen,
  CircleHelp,
  FileText,
  Gauge,
  LifeBuoy,
  Settings,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/admin', label: '数据概览', icon: Gauge },
  { href: '/admin/training', label: '培训管理', icon: BookOpen },
  { href: '/admin/questions', label: '题库管理', icon: CircleHelp },
  { href: '/admin/people', label: '员工与分配', icon: UsersRound },
  { href: '/admin/services', label: '员工服务', icon: LifeBuoy },
  { href: '/admin/documents', label: '参考文档', icon: FileText },
  { href: '/admin/content', label: '内容与公告', icon: FileText },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav" aria-label="管理端导航">
      {items.map(({ href, label, icon: Icon }) => {
        const exact = href === '/admin'
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} data-active={isActive} aria-current={isActive ? 'page' : undefined} aria-label={label} title={label}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span className="admin-nav__label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
