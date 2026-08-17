import { AdminShell } from '@/components/admin-shell'
import { requireAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return <AdminShell user={user}>{children}</AdminShell>
}
