import { AdminPageHeader } from '@/components/admin-page-header'
import { ReferenceDocumentManager } from '@/components/reference-document-manager'
import { requireAdmin } from '@/lib/auth'
import { getAdminCollection } from '@/lib/api/admin-content'

export const metadata = { title: '参考文档管理' }

export default async function ReferenceDocumentsManagementPage() {
  await requireAdmin()
  const documents = await getAdminCollection('reference-documents')
  return <><AdminPageHeader eyebrow="内容运营" title="参考文档库" description="维护新人可以直接查看的公司制度、流程和工作资料。" /><ReferenceDocumentManager initialItems={documents} /></>
}
