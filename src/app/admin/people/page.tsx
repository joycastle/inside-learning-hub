import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminPeopleManager } from '@/components/admin-people-manager'
import { demoFeishuOrganization, trainingRecords } from '@/lib/demo-data'

export const metadata = { title: '员工与分配' }

export default function PeopleManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="人员与期限"
        title="员工与分配"
        description="从飞书组织架构选择员工分配培训，并调整个人截止日期或课程。"
      />
      <AdminPeopleManager initialRecords={trainingRecords} initialOrganization={demoFeishuOrganization} />
    </>
  )
}
