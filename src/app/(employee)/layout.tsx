import { EmployeeShell } from '@/components/employee-shell'
import { requireUser } from '@/lib/auth'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return <EmployeeShell user={user}>{children}</EmployeeShell>
}
