import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminPeopleManager } from '@/components/admin-people-manager'
import { demoFeishuOrganization, trainingRecords } from '@/lib/demo-data'
import { getTrainingRecords } from '@/lib/payload-data'

export const metadata = { title: '员工与分配' }

export default async function PeopleManagementPage() {
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  return (
    <>
      <AdminPageHeader
        eyebrow="人员与期限"
        title="员工与分配"
        description="从飞书组织架构选择员工分配培训，并调整个人截止日期或课程。"
      />
      <AdminPeopleManager initialRecords={records} initialOrganization={demoFeishuOrganization} />
    </>
  )
}
