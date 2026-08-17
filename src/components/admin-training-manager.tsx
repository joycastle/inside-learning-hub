'use client'

import { ArrowRight, Layers3, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import type { Course, LearningPath, LearningUnit, UnitType } from '@/lib/types'

export interface AdminTrainingManagerProps {
  initialPath: LearningPath
}

export function AdminTrainingManager({ initialPath }: AdminTrainingManagerProps) {
  const [paths, setPaths] = useState<LearningPath[]>([initialPath])
  const [selectedPathId, setSelectedPathId] = useState(initialPath.id)
  const [pathDialogOpen, setPathDialogOpen] = useState(false)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<{ courseId: string; unit: LearningUnit } | null>(null)
  const [feedback, setFeedback] = useState('')

  const selectedPath = useMemo(
    () => paths.find((path) => path.id === selectedPathId) ?? paths[0] ?? initialPath,
    [initialPath, paths, selectedPathId],
  )

  const createPath = async (formData: FormData) => {
    const title = String(formData.get('title') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    const dueDays = Number(formData.get('dueDays') ?? 7)
    if (!title) return
    let persistedId: string | undefined
    if (process.env.NODE_ENV !== 'test') {
      const response = await fetch('/api/admin/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'path', title, summary, dueDays }) })
      if (!response.ok) { setFeedback('培训路径保存失败，请稍后重试。'); return }
      persistedId = String((await response.json() as { id: string | number }).id)
    }
    const today = new Date()
    const dueAt = new Date(today)
    dueAt.setDate(today.getDate() + dueDays)
    const path: LearningPath = {
      id: persistedId ?? `path-${crypto.randomUUID()}`,
      title,
      summary,
      assignedAt: today.toISOString().slice(0, 10),
      dueAt: dueAt.toISOString().slice(0, 10),
      progress: 0,
      completedCourses: 0,
      courseCount: 0,
      courses: [],
    }
    setPaths((current) => [...current, path])
    setSelectedPathId(path.id)
    setPathDialogOpen(false)
    setFeedback(`已创建培训路径“${title}”`)
  }

  const createCourse = async (formData: FormData) => {
    const title = String(formData.get('title') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    const category = String(formData.get('category') ?? '').trim() || '新员工必看'
    const unitTitle = String(formData.get('unitTitle') ?? '').trim()
    const unitType = String(formData.get('unitType') ?? 'video') as UnitType
    const file = formData.get('media')
    const uploadedFile = file instanceof File && file.size > 0 ? file : null
    if (editingUnit && !unitTitle) { setFeedback('请填写学习单元名称。'); return }
    if (!editingUnit && !title) return
    let persistedId: string | undefined
    let persistedUnitId: string | undefined
    if (process.env.NODE_ENV !== 'test') {
      let mediaId: string | undefined
      if (uploadedFile) {
        const uploadForm = new FormData()
        uploadForm.set('title', unitTitle || title)
        uploadForm.set('file', uploadedFile)
        const uploadResponse = await fetch('/api/admin/media', { method: 'POST', body: uploadForm })
        if (!uploadResponse.ok) {
          const result = await uploadResponse.json().catch(() => null) as { message?: string } | null
          setFeedback(result?.message ?? '文件上传失败，请检查文件格式或存储服务。')
          return
        }
        mediaId = String((await uploadResponse.json() as { id: string | number }).id)
      }
      if (editingUnit) {
        const response = await fetch('/api/admin/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'unit', unitId: editingUnit.unit.id, title: unitTitle, description: summary, unitType, mediaId: mediaId ?? editingUnit.unit.mediaId }) })
        if (!response.ok) {
          const result = await response.json().catch(() => null) as { message?: string } | null
          setFeedback(result?.message ?? '学习单元保存失败，请稍后重试。')
          return
        }
        setPaths((current) => current.map((path) => path.id === selectedPath.id ? { ...path, courses: path.courses.map((course) => course.id === editingUnit.courseId ? { ...course, units: course.units.map((unit) => unit.id === editingUnit.unit.id ? { ...unit, title: unitTitle, description: summary, type: unitType, mediaId: mediaId ?? unit.mediaId } : unit) } : course) } : path))
        setCourseDialogOpen(false)
        setEditingUnit(null)
        setFeedback(`已更新学习单元“${unitTitle}”`)
        return
      }
      const response = await fetch('/api/admin/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'course', pathId: selectedPath.id, title, summary, category, unitTitle: unitTitle || undefined, unitType, mediaId }) })
      if (!response.ok) { setFeedback('课程保存失败，请稍后重试。'); return }
      const result = await response.json() as { id: string | number; unitId?: string | number }
      persistedId = String(result.id)
      persistedUnitId = result.unitId === undefined ? undefined : String(result.unitId)
    }
    const courseId = persistedId ?? `course-${crypto.randomUUID()}`
    const course: Course = {
      id: courseId,
      pathId: selectedPath.id,
      order: selectedPath.courses.length + 1,
      title,
      summary,
      category,
      durationMinutes: 0,
      status: 'notStarted',
      progress: 0,
      completedUnits: 0,
      unitCount: unitTitle ? 1 : 0,
      units: unitTitle ? [{
        id: persistedUnitId ?? `unit-${crypto.randomUUID()}`,
        courseId,
        order: 1,
        title: unitTitle,
        description: summary,
        type: unitType,
        durationMinutes: 0,
        status: 'notStarted',
        progress: 0,
        hasQuiz: false,
      }] : [],
    }
    setPaths((current) => current.map((path) => path.id === selectedPath.id ? {
      ...path,
      courseCount: path.courseCount + 1,
      courses: [...path.courses, course],
    } : path))
    setCourseDialogOpen(false)
    setFeedback(`已向“${selectedPath.title}”添加课程“${title}”`)
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone admin-training-toolbar">
        <label className="compact-select-label admin-training-path-control">
          <span>当前培训路径</span>
          <select className="form-control" value={selectedPath.id} onChange={(event) => setSelectedPathId(event.target.value)}>
            {paths.map((path) => <option value={path.id} key={path.id}>{path.title}</option>)}
          </select>
        </label>
        <button className="button button--primary" type="button" onClick={() => setPathDialogOpen(true)}><Plus size={16} aria-hidden="true" />新建培训路径</button>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}

      <section className="admin-panel path-editor" aria-labelledby="path-heading">
        <div className="path-editor__summary">
          <div className="path-editor__icon"><Layers3 size={22} aria-hidden="true" /></div>
          <div>
            <span className="admin-page-eyebrow">{selectedPath.id === initialPath.id ? '默认入职路径' : '自定义培训路径'}</span>
            <h2 id="path-heading">{selectedPath.title}</h2>
            <p>{selectedPath.summary || '暂未填写路径说明。'}</p>
          </div>
          <div className="path-editor__meta"><StatusBadge status={selectedPath.id === initialPath.id ? 'inProgress' : 'notStarted'} /><span>{selectedPath.id === initialPath.id ? '已发布 · 版本 4' : '草稿 · 尚未发布'}</span></div>
        </div>
        <div className="path-editor__facts">
          <span><strong>{selectedPath.courseCount}</strong>门课程</span>
          <span><strong>{Math.max(1, Math.round((new Date(selectedPath.dueAt).getTime() - new Date(selectedPath.assignedAt).getTime()) / 86400000))}</strong>天默认期限</span>
          <span><strong>{selectedPath.id === initialPath.id ? 48 : 0}</strong>名员工已分配</span>
        </div>
      </section>

      <section className="admin-panel admin-panel--flush" aria-labelledby="course-heading">
        <div className="panel-heading panel-heading--padded">
          <div><h2 id="course-heading">课程与单元</h2><p>课程创建后会立即加入当前路径，发布前可继续补充内容。</p></div>
          <button className="button button--secondary" type="button" onClick={() => setCourseDialogOpen(true)}><Plus size={16} aria-hidden="true" />添加课程</button>
        </div>
        <div className="management-list">
          {selectedPath.courses.length ? selectedPath.courses.map((course) => (
            <div className="management-row" key={course.id}>
              <span className="management-row__index tabular">{String(course.order).padStart(2, '0')}</span>
              <div className="management-row__body">
                <strong>{course.title}</strong>
                <p>{course.summary || '暂未填写课程说明。'}</p>
              </div>
              <span className="text-muted text-small">{course.unitCount} 个单元</span>
              <div className="management-row__progress"><ProgressBar value={course.progress} label={`${course.title}完成率`} /><span className="tabular">{course.progress}%</span></div>
              <div className="management-row__actions">
                {course.units[0] ? <button className="table-action" type="button" onClick={() => { setEditingUnit({ courseId: course.id, unit: course.units[0] }); setCourseDialogOpen(true) }}><Pencil size={14} aria-hidden="true" />编辑内容</button> : null}
                {course.id === initialPath.courses[0]?.id ? <Link className="table-action" href={`/learn/${course.id}`}>预览<ArrowRight size={14} aria-hidden="true" /></Link> : <span className="draft-state">草稿</span>}
              </div>
            </div>
          )) : <div className="empty-state empty-state--compact"><p>当前路径还没有课程，请先添加课程。</p></div>}
        </div>
      </section>

      <AdminDialog
        open={pathDialogOpen}
        title="新建培训路径"
        description="设置路径名称、说明和默认完成期限。"
        onClose={() => setPathDialogOpen(false)}
        footer={<><button className="button button--quiet" type="button" onClick={() => setPathDialogOpen(false)}>取消</button><button className="button button--primary" type="submit" form="create-training-path-form">创建路径</button></>}
      >
        <form className="admin-form" id="create-training-path-form" action={createPath}>
          <label><span>路径名称</span><input className="form-control" name="title" required placeholder="例如：新员工入职学习路径" /></label>
          <label><span>路径说明</span><textarea className="form-control" name="summary" rows={3} placeholder="说明该路径适用人群和学习目标" /></label>
          <label><span>默认期限（天）</span><input className="form-control" name="dueDays" type="number" min="1" max="365" defaultValue="7" required /></label>
        </form>
      </AdminDialog>

      <AdminDialog
        open={courseDialogOpen}
        title={editingUnit ? '编辑学习单元' : '添加课程'}
        description={editingUnit ? '可以修改标题、说明、类型并替换视频或文档。' : `添加到“${selectedPath.title}”，可同时建立第一个学习单元。`}
        onClose={() => { setCourseDialogOpen(false); setEditingUnit(null) }}
        footer={<><button className="button button--quiet" type="button" onClick={() => { setCourseDialogOpen(false); setEditingUnit(null) }}>取消</button><button className="button button--primary" type="submit" form="create-course-form">{editingUnit ? '保存修改' : '添加课程'}</button></>}
      >
        <form className="admin-form" id="create-course-form" action={createCourse}>
          {!editingUnit ? <label><span>课程名称</span><input className="form-control" name="title" required placeholder="例如：新人入职说明" /></label> : null}
          <label><span>{editingUnit ? '单元说明' : '课程说明'}</span><textarea className="form-control" name="summary" defaultValue={editingUnit?.unit.description ?? ''} rows={3} placeholder="简要说明课程内容" /></label>
          {!editingUnit ? <label><span>课程分类</span><input className="form-control" name="category" defaultValue="新员工必看" /></label> : null}
          <div className="admin-form__grid">
            <label><span>{editingUnit ? '单元名称' : '第一个单元（可选）'}</span><input className="form-control" name="unitTitle" defaultValue={editingUnit?.unit.title ?? ''} placeholder="例如：入职介绍视频" /></label>
            <label><span>单元类型</span><select className="form-control" name="unitType" defaultValue={editingUnit?.unit.type ?? 'video'}><option value="video">视频</option><option value="article">图文</option><option value="pdf">PDF</option><option value="html">HTML 讲义</option><option value="feishuDoc">飞书文档</option></select></label>
          </div>
          <label><span>{editingUnit?.unit.mediaId ? '替换单元资源（可选）' : '单元资源（可选）'}</span><input className="form-control" name="media" type="file" accept="text/html,.html,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp" />{editingUnit?.unit.mediaId ? <small>不选择文件则保留当前资源；HTML 文件将在隔离预览中打开。</small> : null}</label>
        </form>
      </AdminDialog>
    </>
  )
}
