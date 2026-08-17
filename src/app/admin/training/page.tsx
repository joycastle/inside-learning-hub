import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminTrainingManager } from '@/components/admin-training-manager'
import { requireAdmin } from '@/lib/auth'
import { getEnrollments } from '@/lib/api/server'

export const metadata = { title: '培训管理' }

export default async function TrainingManagementPage() {
  await requireAdmin()
  const paths = await getEnrollments()
  const path = paths[0]

  return (
    <>
      <AdminPageHeader
        eyebrow="内容编排"
        title="培训管理"
        description="查看当前培训路径、课程与学习单元。内容编辑统一使用 Payload 数据库。"
        actions={null}
      />

      {path ? <AdminTrainingManager initialPath={path} /> : <section className="admin-panel empty-state"><p>暂无可用培训路径，请先在内容管理中创建。</p></section>}
    </>
  )
}
