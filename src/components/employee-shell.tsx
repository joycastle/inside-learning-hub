import { AvatarMenu } from '@/components/avatar-menu'
import { BrandMark } from '@/components/brand-mark'
import { EmployeeNav } from '@/components/employee-nav'
import { HeaderSearch } from '@/components/header-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationButton } from '@/components/notification-button'
import type { AppUser } from '@/lib/types'
import type { Announcement } from '@/lib/types'

export function EmployeeShell({ user, announcements, children }: { user: AppUser; announcements: Announcement[]; children: React.ReactNode }) {
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
            <NotificationButton announcements={announcements} />
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
