import type { AppUser } from '@/lib/types'

export interface UserAvatarProps {
  user: AppUser
  size?: 'compact' | 'large'
}

export function UserAvatar({ user, size = 'compact' }: UserAvatarProps) {
  return (
    <span className={`user-avatar user-avatar--${size}`} aria-hidden="true">
      {user.avatarUrl ? (
        // 飞书头像地址由租户动态返回，因此不经过 Next.js 图片代理。
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span>{user.name.slice(-1)}</span>
      )}
    </span>
  )
}
