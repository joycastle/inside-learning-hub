import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HtmlDocumentPreview } from '@/components/html-document-preview'

export const metadata = { title: 'HTML 讲义预览' }

export default async function HtmlAttachmentPreviewPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams
  if (!url) notFound()

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    notFound()
  }

  // 只允许预览当前站点的上传 HTML，避免把这个入口当成开放代理。
  if (parsed.origin !== 'https://joyhome.toolnets.net' && parsed.origin !== 'http://localhost:3002') notFound()
  if (!/\.(?:html?|xhtml)$/i.test(parsed.pathname) && !parsed.pathname.includes('/api/v1/media/')) notFound()

  return (
    <div className="page-container handout-page">
      <Link className="handout-page__back" href="/documents"><ArrowLeft size={16} aria-hidden="true" />返回参考文档</Link>
      <article className="reference-document-page">
        <header className="onboarding-document__header">
          <div><span className="eyebrow">HTML 附件预览</span><h1>网页内容预览</h1><p>已在应用内适配当前窗口大小，原 HTML 的交互和动画保持不变。</p></div>
        </header>
        <HtmlDocumentPreview title="HTML 附件" url={parsed.pathname + parsed.search + parsed.hash} />
      </article>
    </div>
  )
}
