import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DocumentPreview } from '@/components/document-preview'
import { getReferenceDocuments } from '@/lib/api/server'

export const metadata = { title: '参考文档' }

export default async function ReferenceDocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params
  const document = (await getReferenceDocuments()).find((item) => item.id === documentId)
  if (!document) notFound()
  const previewType = document.fileType === 'video' ? 'video' : document.fileType === 'html' ? 'html' : document.fileType === 'markdown' ? 'markdown' : document.fileType === 'pdf' ? 'pdf' : document.fileType === 'image' ? 'image' : 'download'
  return <div className="page-container handout-page"><Link className="handout-page__back" href="/documents"><ArrowLeft size={16} aria-hidden="true" />返回参考文档</Link><article className="reference-document-page"><header className="onboarding-document__header"><div><span className="eyebrow">参考文档</span><h1>{document.title}</h1><p>{document.summary}</p></div><span className="document-version">更新于 {new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(document.updatedAt))}</span></header>{document.mediaUrl ? <DocumentPreview title={document.title} type={previewType} url={document.mediaUrl} /> : <div className="reference-document-page__body">{document.html ? <div dangerouslySetInnerHTML={{ __html: document.html }} /> : <p>{document.body || '暂无文档内容。'}</p>}</div>}</article></div>
}
