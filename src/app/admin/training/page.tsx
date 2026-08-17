import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminTrainingManager } from '@/components/admin-training-manager'
import { onboardingPath } from '@/lib/demo-data'

export const metadata = { title: '培训管理' }

export default function TrainingManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="内容编排"
        title="培训管理"
        description="维护学习路径、课程与有序学习单元。当前操作保存在本地原型数据中。"
      />
      <AdminTrainingManager initialPath={onboardingPath} />
    </>
  )
}
