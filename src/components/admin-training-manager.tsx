'use client'

import { ArrowRight, Layers3, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { ProgressBar } from '@/components/progress-bar'
import type { Course, LearningPath, LearningUnit, UnitType } from '@/lib/types'

type DialogKind = 'path' | 'course' | 'unit' | null

export function AdminTrainingManager({ initialPath }: { initialPath: LearningPath }) {
  const [path, setPath] = useState(initialPath)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [editingPath, setEditingPath] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingUnit, setEditingUnit] = useState<LearningUnit | null>(null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const openPath = (edit: boolean) => { setEditingPath(edit); setEditingCourse(null); setEditingUnit(null); setDialog('path') }
  const close = () => { if (!saving) { setDialog(null); setEditingPath(false); setEditingCourse(null); setEditingUnit(null) } }

  const save = async (formData: FormData) => {
    if (saving) return
    setSaving(true)
    const kind = dialog === 'path' ? 'path' : dialog === 'unit' ? 'unit' : 'course'
    const title = String(formData.get('title') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    let url = '/api/v1/admin/training'
    let method = 'POST'
    let body: Record<string, unknown>
    if (kind === 'path') {
      body = { kind, title, summary, dueDays: Number(formData.get('dueDays') ?? 7) }
      if (editingPath) { url = `/api/v1/admin/training/paths/${path.id}`; method = 'PATCH' }
    } else if (kind === 'course') {
      body = { kind, pathId: path.id, title, summary, category: String(formData.get('category') ?? '新员工必看'), unitTitle: String(formData.get('unitTitle') ?? '').trim(), unitType: String(formData.get('unitType') ?? 'video') }
      if (editingCourse) { url = `/api/v1/admin/training/courses/${editingCourse.id}`; method = 'PATCH'; delete body.kind; delete body.pathId; delete body.unitTitle; delete body.unitType }
    } else {
      body = { kind, unitId: editingUnit?.id, title, description: summary, unitType: String(formData.get('unitType') ?? 'video') }
    }
    try {
      const file = formData.get('media')
      if (kind === 'course' && !editingCourse && file instanceof File && file.size > 0 && !String(formData.get('unitTitle') ?? '').trim()) {
        setFeedback('上传第一个单元资源时，请先填写单元名称。')
        return
      }
      if (file instanceof File && file.size > 0) {
        const upload = new FormData()
        upload.set('title', title)
        if (editingUnit?.mediaId) upload.set('previousMediaId', editingUnit.mediaId)
        upload.set('file', file)
        const uploadResponse = await fetch('/api/v1/admin/media', { method: 'POST', headers: { Origin: window.location.origin }, body: upload })
        if (!uploadResponse.ok) { const error = await uploadResponse.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '资源上传失败，请检查文件格式或存储服务。'); return }
        body.mediaId = String((await uploadResponse.json() as { id: string | number }).id)
      }
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify(body) })
      if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '培训内容保存失败，请稍后重试。'); return }
      if (kind === 'path') setPath((current) => ({ ...current, title, summary }))
      if (kind === 'course' && editingCourse) setPath((current) => ({ ...current, courses: current.courses.map((course) => course.id === editingCourse.id ? { ...course, title, summary, category: String(body.category) } : course) }))
      if (kind === 'unit' && editingUnit) setPath((current) => ({ ...current, courses: current.courses.map((course) => ({ ...course, units: course.units.map((unit) => unit.id === editingUnit.id ? { ...unit, title, description: String(body.description), type: body.unitType as UnitType } : unit) })) }))
      setFeedback(kind === 'path' ? '培训路径已保存。' : kind === 'course' ? '课程已保存。' : '学习单元已保存。')
      close()
      if (kind === 'course' && !editingCourse) window.location.reload()
      if (kind === 'unit' && body.mediaId) window.location.reload()
    } catch { setFeedback('网络异常，培训内容保存失败，请稍后重试。') } finally { setSaving(false) }
  }

  const defaultDueDays = Math.max(1, Math.round((new Date(path.dueAt).getTime() - new Date(path.assignedAt).getTime()) / 86400000))
  return <>
    <div className="admin-page-actions admin-page-actions--standalone admin-training-toolbar"><label className="compact-select-label admin-training-path-control"><span>当前培训路径</span><select className="form-control" value={path.id} disabled><option value={path.id}>{path.title}</option></select></label><button className="button button--secondary" type="button" onClick={() => openPath(true)}><Pencil size={16} aria-hidden="true" />编辑培训内容</button><button className="button button--primary" type="button" onClick={() => openPath(false)}><Plus size={16} aria-hidden="true" />新建培训路径</button></div>
    {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
    <section className="admin-panel path-editor" aria-labelledby="path-heading"><div className="path-editor__summary"><div className="path-editor__icon"><Layers3 size={22} aria-hidden="true" /></div><div><span className="admin-page-eyebrow">当前培训路径</span><h2 id="path-heading">{path.title}</h2><p>{path.summary || '暂未填写路径说明。'}</p></div><div className="path-editor__meta"><span>{path.progress}% 已完成</span></div></div><div className="path-editor__facts"><span><strong>{path.courseCount}</strong>门课程</span><span><strong>{defaultDueDays}</strong>天默认期限</span><span><strong>{path.completedCourses}</strong>门课程已完成</span></div></section>
    <section className="admin-panel admin-panel--flush" aria-labelledby="course-heading"><div className="panel-heading panel-heading--padded"><div><h2 id="course-heading">课程与单元</h2><p>课程和资源均来自线上数据库。</p></div><button className="button button--secondary" type="button" onClick={() => { setEditingCourse(null); setEditingUnit(null); setDialog('course') }}><Plus size={16} aria-hidden="true" />添加课程</button></div><div className="management-list">{path.courses.length ? path.courses.map((course) => <div className="management-row" key={course.id}><span className="management-row__index tabular">{String(course.order).padStart(2, '0')}</span><div className="management-row__body"><strong>{course.title}</strong><p>{course.summary || '暂未填写课程说明。'}</p></div><span className="text-muted text-small">{course.unitCount} 个单元</span><div className="management-row__progress"><ProgressBar value={course.progress} label={`${course.title}完成率`} /><span className="tabular">{course.progress}%</span></div><div className="management-row__actions"><button className="table-action" type="button" onClick={() => { setEditingCourse(course); setEditingUnit(null); setDialog('course') }}><Pencil size={14} aria-hidden="true" />编辑课程</button>{course.units[0] ? <button className="table-action" type="button" onClick={() => { setEditingCourse(null); setEditingUnit(course.units[0]); setDialog('unit') }}><Pencil size={14} aria-hidden="true" />编辑培训内容</button> : null}<a className="table-action" href={`/learn/${course.id}`}><ArrowRight size={14} aria-hidden="true" />预览</a></div></div>) : <div className="empty-state empty-state--compact"><p>当前路径还没有课程，请先添加课程。</p></div>}</div></section>
    <AdminDialog open={Boolean(dialog)} title={dialog === 'path' ? (editingPath ? '编辑培训内容' : '新建培训路径') : dialog === 'unit' ? '编辑学习单元' : editingCourse ? '编辑课程' : '添加课程'} description={dialog === 'unit' ? '可以修改标题、说明和类型。' : '保存后会立即写入线上内容库。'} size="large" onClose={close} footer={<><button className="button button--quiet" type="button" onClick={close} disabled={saving}>取消</button><button className="button button--primary" type="submit" form="training-editor-form" disabled={saving}>{saving ? '保存中…' : dialog === 'path' && !editingPath ? '创建路径' : '保存修改'}</button></>}>
      {dialog ? <form key={`${dialog}-${editingPath}-${editingCourse?.id ?? ''}-${editingUnit?.id ?? ''}`} className="admin-form" id="training-editor-form" action={save}>{dialog === 'path' ? <><label><span>路径名称</span><input className="form-control" name="title" defaultValue={editingPath ? path.title : ''} required /></label><label><span>路径说明</span><textarea className="form-control" name="summary" defaultValue={editingPath ? path.summary : ''} rows={3} /></label><label><span>默认期限（天）</span><input className="form-control" name="dueDays" type="number" min="1" max="365" defaultValue={defaultDueDays} required /></label></> : dialog === 'unit' ? <><label><span>单元名称</span><input className="form-control" name="title" defaultValue={editingUnit?.title ?? ''} required /></label><label><span>单元说明</span><textarea className="form-control" name="summary" defaultValue={editingUnit?.description ?? ''} rows={3} /></label><label><span>单元类型</span><select className="form-control" name="unitType" defaultValue={editingUnit?.type ?? 'video'}><option value="video">视频</option><option value="html">HTML 讲义</option><option value="article">图文</option><option value="pdf">PDF</option><option value="feishuDoc">飞书文档</option></select></label><label><span>单元资源（可选）</span><input className="form-control" name="media" type="file" accept="text/html,.html,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp" /><small>{editingUnit?.mediaId ? '不选择文件则保留当前资源；选择新文件会替换关联版本。' : '可上传视频、HTML、PDF 或文档资源。'}</small></label></> : <><label><span>课程名称</span><input className="form-control" name="title" defaultValue={editingCourse?.title ?? ''} required /></label><label><span>课程说明</span><textarea className="form-control" name="summary" defaultValue={editingCourse?.summary ?? ''} rows={3} /></label><label><span>课程分类</span><input className="form-control" name="category" defaultValue={editingCourse?.category ?? '新员工必看'} /></label>{!editingCourse ? <div className="admin-form__grid"><label><span>第一个单元（可选）</span><input className="form-control" name="unitTitle" /></label><label><span>单元类型</span><select className="form-control" name="unitType" defaultValue="video"><option value="video">视频</option><option value="html">HTML 讲义</option><option value="article">图文</option><option value="pdf">PDF</option><option value="feishuDoc">飞书文档</option></select></label><label><span>第一个单元资源（可选）</span><input className="form-control" name="media" type="file" accept="text/html,.html,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp" /></label></div> : null}</>}</form> : null}
    </AdminDialog>
  </>
}
