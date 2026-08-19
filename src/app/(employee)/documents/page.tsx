import { getReferenceDocuments } from '@/lib/api/server'
import { ReferenceDocumentBrowser } from '@/components/reference-document-browser'

export const metadata = { title: '参考文档' }

export default async function ReferenceDocumentsPage() {
  const documents = await getReferenceDocuments()
  return <div className="page-container main-content"><header className="services-header"><div><h1 className="page-heading">参考文档</h1><p className="page-description">直接查看公司制度、工作流程和新人常用资料。</p></div></header><ReferenceDocumentBrowser documents={documents} /></div>
}
