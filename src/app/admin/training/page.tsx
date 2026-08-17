import { ArrowRight, Layers3 } from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin-page-header'
import { requireAdmin } from '@/lib/auth'
import { getEnrollments } from '@/lib/api/server'

export const metadata = { title: '培训管理' }

export default async function TrainingManagementPage() {
  await requireAdmin()
  const paths = await getEnrollments()
  const path = paths[0]

  return (
    <>
      <AdminPageHeader
        eyebrow="内容编排"
        title="培训管理"
        description="查看当前培训路径、课程与学习单元。内容编辑统一使用 Payload 数据库。"
        actions={(
          <Link className="button button--primary" href="/admin/training?new=path">
            编辑培训内容 <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      />

      {path ? (
        <>
          <section className="admin-panel path-editor" aria-labelledby="path-heading">
            <div className="path-editor__summary">
              <div className="path-editor__icon"><Layers3 size={22} aria-hidden="true" /></div>
              <div>
                <span className="admin-page-eyebrow">当前培训路径</span>
                <h2 id="path-heading">{path.title}</h2>
                <p>{path.summary || '暂未填写路径说明。'}</p>
              </div>
              <div className="path-editor__meta"><span>{path.progress}% 已完成</span></div>
            </div>
            <div className="path-editor__facts">
              <span><strong>{path.courseCount}</strong>门课程</span>
              <span><strong>{Math.max(0, Math.round((new Date(path.dueAt).getTime() - new Date(path.assignedAt).getTime()) / 86400000))}</strong>天默认期限</span>
              <span><strong>{path.completedCourses}</strong>门课程已完成</span>
            </div>
          </section>

          <section className="admin-panel admin-panel--flush" aria-labelledby="course-heading">
            <div className="panel-heading panel-heading--padded">
              <div><h2 id="course-heading">课程与单元</h2><p>课程和资源均来自线上 Payload 数据库。</p></div>
            </div>
            <div className="management-list">
              {path.courses.length ? path.courses.map((course) => (
                <div className="management-row" key={course.id}>
                  <span className="management-row__index tabular">{String(course.order).padStart(2, '0')}</span>
                  <div className="management-row__body"><strong>{course.title}</strong><p>{course.summary || '暂未填写课程说明。'}</p></div>
                  <span className="text-muted text-small">{course.unitCount} 个单元</span>
                  <div className="management-row__progress"><progress className="compact-progress" max="100" value={course.progress} /><span className="tabular">{course.progress}%</span></div>
                  <Link className="table-action" href={`/admin/training?edit=${course.id}`}>编辑课程 <ArrowRight size={14} aria-hidden="true" /></Link>
                </div>
              )) : <div className="empty-state empty-state--compact"><p>当前路径还没有课程。</p></div>}
            </div>
          </section>
        </>
      ) : <section className="admin-panel empty-state"><p>暂无可用培训路径，请先在内容管理中创建。</p></section>}
    </>
  )
}
