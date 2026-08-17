import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminQuestionManager } from '@/components/admin-question-manager'
import { onboardingPath, questionBank } from '@/lib/demo-data'
import { getAllQuizQuestions, getDefaultLearningPath } from '@/lib/payload-data'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: '题库管理' }

export default async function QuestionManagementPage() {
  await requireAdmin()
  const initialPath = process.env.DEMO_MODE === 'false' ? await getDefaultLearningPath() : onboardingPath
  const initialQuestions = process.env.DEMO_MODE === 'false' ? await getAllQuizQuestions() : questionBank
  return (
    <>
      <AdminPageHeader
        eyebrow="随机测评"
        title="题库管理"
        description="新建、导入并维护选择题；历史作答保存题目快照，不受后续编辑影响。"
      />
      <AdminQuestionManager initialPath={initialPath ?? onboardingPath} initialQuestions={initialQuestions} />
    </>
  )
}
