'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeftRight, LogOut, Settings, UserRound } from 'lucide-react'
import Link from 'next/link'
import { UserAvatar } from '@/components/user-avatar'
import type { AppUser } from '@/lib/types'

interface AvatarMenuProps {
  user: AppUser
  inAdmin?: boolean
  menuSide?: 'top' | 'bottom'
  menuAlign?: 'start' | 'end'
}

export function AvatarMenu({ user, inAdmin = false, menuSide = 'bottom', menuAlign = 'end' }: AvatarMenuProps) {
  const canAccessAdmin = user.role === 'admin' || user.role === 'superAdmin'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="avatar-trigger" aria-label="打开账户菜单">
        <UserAvatar user={user} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content" side={menuSide} sideOffset={8} align={menuAlign}>
          <DropdownMenu.Label className="menu-label">
            <UserAvatar user={user} />
            <span><strong>{user.name}</strong>{user.departmentName} · 飞书账号</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="menu-separator" />
          <DropdownMenu.Item asChild>
            <Link className="menu-item" href="/me">
              <UserRound size={16} aria-hidden="true" />个人学习记录
            </Link>
          </DropdownMenu.Item>
          {canAccessAdmin ? (
            <DropdownMenu.Item asChild>
              <Link className="menu-item" href={inAdmin ? '/home' : '/admin'}>
                <ArrowLeftRight size={16} aria-hidden="true" />
                {inAdmin ? '返回员工端' : '切换到管理端'}
              </Link>
            </DropdownMenu.Item>
          ) : null}
          {user.role === 'superAdmin' && inAdmin ? (
            <DropdownMenu.Item asChild>
              <Link className="menu-item" href="/admin/settings">
                <Settings size={16} aria-hidden="true" />系统设置
              </Link>
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Separator className="menu-separator" />
          <DropdownMenu.Item asChild>
            <form action="/api/v1/auth/logout" method="post">
              <button className="menu-item" type="submit">
                <LogOut size={16} aria-hidden="true" />退出登录
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
