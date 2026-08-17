import { AdminPageHeader } from '@/components/admin-page-header'
import { AdminPeopleManager } from '@/components/admin-people-manager'
import { getAnalyticsOverview, getOrganization } from '@/lib/api/server'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: '员工与分配' }

export default async function PeopleManagementPage() {
  await requireAdmin()
  const [overview, organization] = await Promise.all([getAnalyticsOverview(), getOrganization()])
  return (
    <>
      <AdminPageHeader
        eyebrow="人员与期限"
        title="员工与分配"
        description="从飞书组织架构选择员工分配培训，并调整个人截止日期或课程。"
      />
      <AdminPeopleManager initialRecords={overview.records} initialOrganization={organization} />
    </>
  )
}
