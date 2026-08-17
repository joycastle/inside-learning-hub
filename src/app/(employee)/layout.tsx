import { EmployeeShell } from '@/components/employee-shell'
import { requireUser } from '@/lib/auth'
import { getAnnouncementsForUser } from '@/lib/payload-data'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const announcements = process.env.DEMO_MODE === 'false' ? await getAnnouncementsForUser(user) : []
  return <EmployeeShell user={user} announcements={announcements}>{children}</EmployeeShell>
}
