import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminContentManager } from '@/components/admin-content-manager'
import { requireAdmin } from '@/lib/auth'
import { getAdminCollection } from '@/lib/api/admin-content'

export const metadata = { title: '员工服务管理' }

export default async function ServicesManagementPage() {
  await requireAdmin()
  const articles = await getAdminCollection('knowledge-articles')
  return (
    <>
      <AdminPageHeader eyebrow="员工服务" title="服务内容管理" description="维护 HR、行政和 IT 服务文章及其配套资源。" />
      <AdminContentManager collection="knowledge-articles" initialItems={articles} emptyText="暂无服务内容，点击右上角新建。" />
    </>
  )
}
