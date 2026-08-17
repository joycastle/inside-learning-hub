import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serviceArticles } from '@/lib/demo-data'
import { formatDate } from '@/lib/format'
import { getServiceArticles } from '@/lib/payload-data'
import { createMediaDownloadUrl } from '@/lib/media-storage'
import { requireUser } from '@/lib/auth'
import { DocumentPreview } from '@/components/document-preview'

export default async function ServiceArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params
  await requireUser()
  const articles = process.env.DEMO_MODE === 'false' ? await getServiceArticles() : serviceArticles
  const article = articles.find((item) => item.id === articleId)
  if (!article) notFound()
  const mediaUrl = article.mediaKey ? await createMediaDownloadUrl(article.mediaKey) : undefined

  return (
    <div className="page-container main-content service-article-page">
      <Link className="lesson-sidebar__back" href="/services"><ArrowLeft size={15} aria-hidden="true" />返回员工服务</Link>
      <article className="service-article">
        <div className="lesson-content__meta">{article.category} · 更新于 {formatDate(article.updatedAt)}</div>
        <h1 className="page-heading">{article.title}</h1>
        <p className="page-description">{article.summary}</p>
        {article.type === 'pdf' && mediaUrl ? <DocumentPreview title={article.title} type="pdf" url={mediaUrl} /> : null}
        <div className="article-body service-article__body">
          {article.source ? <aside className="service-source-note"><strong>制度来源</strong><span>{article.source}</span></aside> : null}
          {article.sections?.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </section>
          ))}
          <aside className="service-policy-note">本页为员工手册的便捷摘要，不替代完整制度。发生版本更新或与公司最新公告不一致时，以最新公示文件及审批结果为准。</aside>
        </div>
        {article.url ? <a className="button button--primary" href={article.url} target="_blank" rel="noreferrer">前往办理<ExternalLink size={16} aria-hidden="true" /></a> : null}
        {mediaUrl ? <a className="button button--secondary" href={mediaUrl} target="_blank" rel="noreferrer">打开附件<ExternalLink size={16} aria-hidden="true" /></a> : null}
      </article>
    </div>
  )
}
