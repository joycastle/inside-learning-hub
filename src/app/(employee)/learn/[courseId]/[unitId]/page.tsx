import { ArrowLeft, ArrowRight, BookOpenText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocumentPreview } from '@/components/document-preview'
import { VideoLesson } from '@/components/video-lesson'
import { UnitCompletionButton } from '@/components/unit-completion-button'
import { getEnrollments } from '@/lib/api/server'

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

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; unitId: string }> }) {
  const { courseId, unitId } = await params
  const paths = await getEnrollments()
  const course = paths.flatMap((path) => path.courses).find((item) => item.id === courseId)
  const unit = course?.units.find((item) => item.id === unitId)
  if (!course || !unit) notFound()
  const resources = unit.resources?.length ? unit.resources : unit.externalUrl ? [{ id: unit.mediaId ?? `${unit.id}-legacy`, title: unit.title, url: unit.externalUrl, mimeType: unit.type === 'video' ? 'video/mp4' : unit.type }] : []
  const videoResources = resources.filter((resource) => resourceType(resource.mimeType, resource.filename) === 'video')

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar">
        <Link className="lesson-sidebar__back" href="/learn"><ArrowLeft size={15} aria-hidden="true" />返回新人入职</Link>
        <h2>{course.title}</h2>
        <div className="lesson-nav-list">
          {course.units.map((item) => (
            <Link className="lesson-nav-link" data-active={item.id === unit.id} href={`/learn/${course.id}/${item.id}`} key={item.id}>
              <span>{String(item.order).padStart(2, '0')}</span><span>{item.title}</span>
            </Link>
          ))}
        </div>
      </aside>

      <main className="lesson-main">
        <article className="lesson-content">
          <div className="lesson-content__meta">入职说明视频</div>
          <h1>{unit.title}</h1>
          <p className="lesson-content__lead">{unit.description}</p>

          {unit.type === 'video' ? (
            <>
              {videoResources.length ? <VideoLesson
                unitId={unit.id}
                source={videoResources[0].url}
                initialProgress={unit.progress}
                hasQuiz={unit.hasQuiz}
                quizUnlocked
              >
                <aside className="lesson-handout-link" aria-labelledby="lesson-handout-title">
                <span className="lesson-handout-link__icon" aria-hidden="true"><BookOpenText size={20} strokeWidth={1.7} /></span>
                <div>
                  <h2 id="lesson-handout-title">新人培训手册</h2>
                  <p>HTML 讲义 · 视频配套内容已整理为独立网页，可随时打开阅读。</p>
                </div>
                <Link className="button button--secondary" href="/learn/onboarding-handout">
                  打开讲义<ArrowRight size={16} aria-hidden="true" />
                </Link>
                </aside>
              </VideoLesson> : <div className="surface empty-state"><h2 className="section-heading">视频暂不可用</h2><p>当前单元尚未关联视频资源。</p></div>}
              {resources.filter((resource) => resource.id !== videoResources[0]?.id).map((resource) => <DocumentPreview key={resource.id} title={resource.title} type={resourceType(resource.mimeType, resource.filename)} url={resource.url} />)}
            </>
          ) : null}

          {unit.type === 'article' ? (
            <div className="article-body">
              {(unit.content ?? ['本单元内容正在整理中。']).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ) : null}

          {unit.type === 'feishuDoc' ? (
            <div className="surface quiz-shell">
              <h2 className="section-heading">在飞书中阅读完整员工手册</h2>
              <p className="section-description">文档将在新窗口打开。阅读完成后返回这里继续下一单元。</p>
              <a className="button button--primary lesson-external-button" href={unit.externalUrl} target="_blank" rel="noreferrer">
                打开飞书文档<ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          ) : null}

          {unit.type === 'pdf' || unit.type === 'html' ? (resources.length ? resources.map((resource) => <DocumentPreview key={resource.id} title={resource.title} type={resourceType(resource.mimeType, resource.filename)} url={resource.url} />) : <div className="surface empty-state"><h2 className="section-heading">{unit.type === 'pdf' ? 'PDF' : 'HTML 讲义'}暂不可用</h2><p>当前单元尚未关联文件资源。</p></div>) : null}

          {unit.type !== 'video' ? <UnitCompletionButton unitId={unit.id} completed={unit.status === 'completed'} /> : null}

        </article>
      </main>
    </div>
  )
}
