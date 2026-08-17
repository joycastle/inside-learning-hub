import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminAnnouncementManager, type ManagedAnnouncement } from '@/components/admin-announcement-manager'

export const metadata = { title: '内容与公告' }

const announcements: ManagedAnnouncement[] = [
  { title: '2026 年差旅与费用报销规范已更新', audience: '全员', publishedAt: '2026-08-12', status: '已发布' },
  { title: '新员工入职第一周安排', audience: '近 30 天入职员工', publishedAt: '2026-08-08', status: '已发布' },
  { title: '年度信息安全复训提醒', audience: '全员', publishedAt: '—', status: '草稿' },
]

export default function ContentManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="内容运营"
        title="内容与公告"
        description="发布员工首页必读通知，控制展示人群与有效期。"
      />
      <AdminAnnouncementManager initialAnnouncements={announcements} />
    </>
  )
}
