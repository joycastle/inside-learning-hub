'use client'

import Link from 'next/link'
import { BookOpen, Home, LifeBuoy } from 'lucide-react'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', label: '首页', icon: Home },
  { href: '/learn', label: '员工培训', icon: BookOpen },
  { href: '/services', label: '员工服务', icon: LifeBuoy },
]

export function EmployeeNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={mobile ? 'mobile-nav' : 'employee-nav'} aria-label="员工端导航">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/home' && pathname.startsWith(`${href}/`))
        return (
          <Link key={href} href={href} data-active={isActive} aria-current={isActive ? 'page' : undefined}>
            {mobile ? <Icon size={18} strokeWidth={1.8} aria-hidden="true" /> : null}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
