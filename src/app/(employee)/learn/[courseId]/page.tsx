import { ArrowRight, BookOpen, FileText, Film, Link2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import { requireUser } from '@/lib/auth'
import { onboardingPath } from '@/lib/demo-data'
import { getCourseById } from '@/lib/payload-data'
import type { UnitType } from '@/lib/types'

const unitIcons: Record<UnitType, typeof Film> = {
  video: Film,
  article: BookOpen,
  pdf: FileText,
  feishuDoc: Link2,
}

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const user = await requireUser()
  const course = process.env.DEMO_MODE === 'false'
    ? await getCourseById(courseId, user)
    : onboardingPath.courses.find((item) => item.id === courseId)
  if (!course) notFound()

  return (
    <div className="page-container main-content">
      <Link className="lesson-sidebar__back" href="/learn">← 返回学习中心</Link>
      <header className="course-detail-header">
        <div>
          <h1 className="page-heading">{course.title}</h1>
          <p className="page-description">{course.summary}</p>
          <div className="course-detail-meta">
            <span>{course.category}</span>
            <span>{course.unitCount} 个视频</span>
          </div>
        </div>
        <div>
          <div className="learning-spread__progress-row">
            <span>观看进度</span><strong className="tabular">{course.progress}%</strong>
          </div>
          <ProgressBar value={course.progress} label={`${course.title}进度`} />
        </div>
      </header>

      {course.units.length ? (
        <section aria-labelledby="course-outline">
          <h2 className="section-heading" id="course-outline">入职视频</h2>
          <div className="unit-table unit-table--spaced">
            {course.units.map((unit) => {
              const Icon = unitIcons[unit.type]
              return (
                <Link className="unit-row" href={`/learn/${course.id}/${unit.id}`} key={unit.id}>
                  <span className="text-small text-muted">{String(unit.order).padStart(2, '0')}</span>
                  <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                  <span><h3>{unit.title}</h3><p>{unit.description}</p></span>
                  <StatusBadge status={unit.status} />
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="surface empty-state">
          <h2 className="section-heading">视频准备中</h2>
          <p>入职视频发布后会显示在这里。</p>
        </section>
      )}
    </div>
  )
}
