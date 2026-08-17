import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminContentManager } from '@/components/admin-content-manager'
import { requireAdmin } from '@/lib/auth'
import { getAdminCollection } from '@/lib/api/admin-content'

export const metadata = { title: '公告管理' }

export default async function ContentManagementPage() {
  await requireAdmin()
  const announcements = await getAdminCollection('announcements')
  return (
    <>
      <AdminPageHeader eyebrow="内容运营" title="公告管理" description="管理员工首页与通知面板展示的真实公告。" />
      <AdminContentManager collection="announcements" initialItems={announcements} emptyText="暂无公告，点击右上角新建第一条公告。" />
    </>
  )
}
