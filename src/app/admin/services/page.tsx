import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminServiceManager } from '@/components/admin-service-manager'
import { serviceArticles } from '@/lib/demo-data'

export const metadata = { title: '员工服务管理' }

export default function ServicesManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="一站式服务"
        title="员工服务"
        description="维护 HR、行政与 IT 制度知识和办理入口。员工端搜索复用同一份已发布内容。"
      />
      <AdminServiceManager initialArticles={serviceArticles} />
    </>
  )
}
