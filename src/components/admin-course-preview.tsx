import { ArrowLeft, BookOpenText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { DocumentPreview } from '@/components/document-preview'
import type { Course } from '@/lib/types'

const resourceType = (mimeType = '', filename = ''): 'video' | 'html' | 'pdf' | 'markdown' | 'image' | 'document' | 'download' => {
  const value = `${mimeType} ${filename}`.toLowerCase()
  if (value.includes('video/') || value.endsWith('.mp4')) return 'video'
  if (value.includes('html') || value.endsWith('.html') || value.endsWith('.htm')) return 'html'
  if (value.includes('pdf') || value.endsWith('.pdf')) return 'pdf'
  if (value.includes('markdown') || value.endsWith('.md') || value.endsWith('.markdown')) return 'markdown'
  if (value.includes('image/') || /\.(png|jpe?g|webp|gif)$/.test(value)) return 'image'
  if (value.includes('word') || /\.(doc|docx)$/.test(value)) return 'document'
  return 'download'
}

export function AdminCoursePreview({ course }: { course: Course }) {
  return (
    <div className="admin-course-preview">
      <div className="admin-course-preview__toolbar">
        <Link className="table-action" href="/admin/training"><ArrowLeft size={15} aria-hidden="true" />返回培训管理</Link>
        <span className="publish-state">管理端预览 · 不记录学习进度</span>
      </div>
      <header className="admin-course-preview__header">
        <span className="admin-page-eyebrow"><BookOpenText size={15} aria-hidden="true" />{course.category}</span>
        <h1>{course.title}</h1>
        <p>{course.summary || '暂未填写课程说明。'}</p>
      </header>
      <div className="admin-course-preview__units">
        {course.units.length ? course.units.map((unit) => (
          <article className="admin-course-preview__unit" key={unit.id}>
            <div className="admin-course-preview__unit-heading">
              <span>{String(unit.order).padStart(2, '0')}</span>
              <div><h2>{unit.title}</h2><p>{unit.description || '暂未填写单元说明。'}</p></div>
            </div>
            {unit.type === 'video' ? (unit.resources?.length ? unit.resources.map((resource) => resourceType(resource.mimeType, resource.filename) === 'video' ? <video className="admin-course-preview__video" key={resource.id} controls playsInline preload="metadata" src={resource.url} /> : <DocumentPreview key={resource.id} title={resource.title} type={resourceType(resource.mimeType, resource.filename)} url={resource.url} />) : unit.videoUrl || unit.externalUrl ? <video className="admin-course-preview__video" controls playsInline preload="metadata" src={unit.videoUrl ?? unit.externalUrl} /> : <div className="surface empty-state"><p>当前单元尚未关联视频资源。</p></div>) : null}
            {unit.type === 'article' ? <div className="article-body">{(unit.content ?? ['当前单元暂无图文内容。']).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div> : null}
            {unit.type === 'pdf' || unit.type === 'html' ? (unit.resources?.length ? unit.resources.map((resource) => <DocumentPreview key={resource.id} title={resource.title} type={resourceType(resource.mimeType, resource.filename)} url={resource.url} />) : unit.externalUrl ? <DocumentPreview title={unit.title} type={unit.type} url={unit.externalUrl} /> : null) : null}
            {unit.type === 'feishuDoc' ? (unit.externalUrl ? <a className="button button--secondary" href={unit.externalUrl} target="_blank" rel="noreferrer">打开飞书文档<ExternalLink size={15} aria-hidden="true" /></a> : <div className="surface empty-state"><p>当前单元尚未关联飞书文档。</p></div>) : null}
            {unit.type !== 'article' && unit.type !== 'video' && unit.type !== 'pdf' && unit.type !== 'html' && unit.type !== 'feishuDoc' ? <div className="surface empty-state"><p>当前单元暂不支持预览。</p></div> : null}
            {(unit.type === 'pdf' || unit.type === 'html') && !unit.externalUrl ? <div className="surface empty-state"><p>当前单元尚未关联文件资源。</p></div> : null}
          </article>
        )) : <div className="empty-state"><p>当前课程还没有学习单元。</p></div>}
      </div>
    </div>
  )
}
