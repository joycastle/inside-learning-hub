import { Bell } from 'lucide-react'
import { AvatarMenu } from '@/components/avatar-menu'
import { BrandMark } from '@/components/brand-mark'
import { EmployeeNav } from '@/components/employee-nav'
import { HeaderSearch } from '@/components/header-search'
import { ThemeToggle } from '@/components/theme-toggle'
import type { AppUser } from '@/lib/types'

export function EmployeeShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <header className="employee-header">
        <div className="employee-header__inner">
          <div className="employee-header__start">
            <BrandMark />
            <EmployeeNav />
          </div>
          <div className="header-actions">
            <HeaderSearch />
            <button className="icon-button" type="button" aria-label="通知">
              <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <ThemeToggle />
            <AvatarMenu user={user} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <EmployeeNav mobile />
    </div>
  )
}
