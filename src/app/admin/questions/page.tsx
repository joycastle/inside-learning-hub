import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminQuestionManager } from '@/components/admin-question-manager'
import { onboardingPath, questionBank } from '@/lib/demo-data'

export const metadata = { title: '题库管理' }

export default function QuestionManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="随机测评"
        title="题库管理"
        description="新建、导入并维护选择题；历史作答保存题目快照，不受后续编辑影响。"
      />
      <AdminQuestionManager initialPath={onboardingPath} initialQuestions={questionBank} />
    </>
  )
}
