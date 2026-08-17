import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminServiceManager } from '@/components/admin-service-manager'
import { serviceArticles } from '@/lib/demo-data'
import { getServiceArticles } from '@/lib/payload-data'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: '员工服务管理' }

export default async function ServicesManagementPage() {
  await requireAdmin()
  const articles = process.env.DEMO_MODE === 'false' ? await getServiceArticles() : serviceArticles
  return (
    <>
      <AdminPageHeader
        eyebrow="一站式服务"
        title="员工服务"
        description="维护 HR、行政与 IT 制度知识和办理入口。员工端搜索复用同一份已发布内容。"
      />
      <AdminServiceManager initialArticles={articles} />
    </>
  )
}
