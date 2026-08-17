import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminTrainingManager } from '@/components/admin-training-manager'
import { onboardingPath } from '@/lib/demo-data'
import { getDefaultLearningPath } from '@/lib/payload-data'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: '培训管理' }

export default async function TrainingManagementPage() {
  await requireAdmin()
  const initialPath = process.env.DEMO_MODE === 'false' ? await getDefaultLearningPath() : onboardingPath
  return (
    <>
      <AdminPageHeader
        eyebrow="内容编排"
        title="培训管理"
        description="维护学习路径、课程与有序学习单元。新增内容会保存到 Payload 数据库。"
      />
      <AdminTrainingManager initialPath={initialPath ?? onboardingPath} />
    </>
  )
}
