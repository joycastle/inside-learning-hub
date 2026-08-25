import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminQuestionManager } from '@/components/admin-question-manager'
import { requireAdmin } from '@/lib/auth'
import { getAdminCollection } from '@/lib/api/admin-content'

export const metadata = { title: '题库管理' }

export default async function QuestionManagementPage() {
  await requireAdmin()
  const questions = await getAdminCollection('questions')
  return (
    <>
      <AdminPageHeader eyebrow="测评内容" title="题库管理" description="查看和维护培训测评题目，数据统一保存到统一内容库。" />
      <AdminQuestionManager initialQuestions={questions} />
    </>
  )
}
