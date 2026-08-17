'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { AdminNav } from '@/components/admin-nav'
import { AvatarMenu } from '@/components/avatar-menu'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import type { AppUser } from '@/lib/types'

export function AdminShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="admin-layout" data-sidebar-collapsed={sidebarCollapsed}>
      <aside className="admin-sidebar">
        <BrandMark href="/admin" label="乐堡家园管理端" />
        <AdminNav />
        <div className="admin-account-dock">
          <AvatarMenu user={user} inAdmin menuSide="top" menuAlign="start" />
          <ThemeToggle />
          <button
            className="admin-sidebar-toggle"
            type="button"
            aria-label={sidebarCollapsed ? '展开管理端导航' : '收起管理端导航'}
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            <span className="admin-sidebar-toggle__label">{sidebarCollapsed ? '展开导航' : '收起导航'}</span>
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
