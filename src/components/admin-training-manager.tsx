'use client'

import { Archive, ArrowRight, Layers3, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { ProgressBar } from '@/components/progress-bar'
import type { Course, LearningPath, LearningUnit, OnboardingHandout, UnitType } from '@/lib/types'

type DialogKind = 'path' | 'course' | 'unit' | 'newUnit' | null

export function AdminTrainingManager({ initialPath, initialHandout }: { initialPath: LearningPath; initialHandout: OnboardingHandout }) {
  const [path, setPath] = useState(initialPath)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [editingPath, setEditingPath] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingUnit, setEditingUnit] = useState<LearningUnit | null>(null)
  const [retainedMediaIds, setRetainedMediaIds] = useState<string[]>([])
  const [unitCourseId, setUnitCourseId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [handout, setHandout] = useState(initialHandout)
  const [savingHandout, setSavingHandout] = useState(false)

  useEffect(() => {
    setRetainedMediaIds(editingUnit?.mediaIds ?? (editingUnit?.mediaId ? [editingUnit.mediaId] : []))
  }, [editingUnit])

  const openPath = (edit: boolean) => { setEditingPath(edit); setEditingCourse(null); setEditingUnit(null); setRetainedMediaIds([]); setUnitCourseId(null); setDialog('path') }
  const close = (force = false) => {
    if (saving && !force) return
    setDialog(null)
    setEditingPath(false)
    setEditingCourse(null)
    setEditingUnit(null)
    setRetainedMediaIds([])
    setUnitCourseId(null)
  }

  const save = async (formData: FormData) => {
    if (saving) return
    setSaving(true)
    const kind = dialog === 'path' ? 'path' : dialog === 'unit' || dialog === 'newUnit' ? 'unit' : 'course'
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
      body = { kind, unitId: editingUnit?.id, courseId: unitCourseId, title, description: summary, unitType: String(formData.get('unitType') ?? 'video') }
    }
    try {
      const files = formData.getAll('media').filter((value): value is File => value instanceof File && value.size > 0)
      if (kind === 'course' && !editingCourse && files.length && !String(formData.get('unitTitle') ?? '').trim()) {
        setFeedback('上传第一个单元资源时，请先填写单元名称。')
        return
      }
      if (files.length) {
        const existingMediaIds = editingUnit ? retainedMediaIds : []
        const uploadedMediaIds: string[] = []
        for (const file of files) {
        const upload = new FormData()
        upload.set('title', files.length > 1 ? `${title} · ${file.name}` : title)
        if (editingUnit?.mediaId && uploadedMediaIds.length === 0) upload.set('previousMediaId', editingUnit.mediaId)
        upload.set('file', file)
        const uploadResponse = await fetch('/api/v1/admin/media', { method: 'POST', headers: { Origin: window.location.origin }, body: upload })
        if (!uploadResponse.ok) { const error = await uploadResponse.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '资源上传失败，请检查文件格式或存储服务。'); return }
          uploadedMediaIds.push(String((await uploadResponse.json() as { id: string | number }).id))
        }
        const mediaIds = [...new Set([...existingMediaIds, ...uploadedMediaIds])]
        body.mediaIds = mediaIds
        body.mediaId = mediaIds[0]
      } else if (kind === 'unit' && editingUnit) {
        body.mediaIds = retainedMediaIds
        body.mediaId = retainedMediaIds[0]
      }
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify(body) })
      if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '培训内容保存失败，请稍后重试。'); return }
      if (kind === 'path') setPath((current) => ({ ...current, title, summary }))
      if (kind === 'course' && editingCourse) setPath((current) => ({ ...current, courses: current.courses.map((course) => course.id === editingCourse.id ? { ...course, title, summary, category: String(body.category) } : course) }))
      if (kind === 'unit' && editingUnit) setPath((current) => ({ ...current, courses: current.courses.map((course) => ({ ...course, units: course.units.map((unit) => unit.id === editingUnit.id ? { ...unit, title, description: String(body.description), type: body.unitType as UnitType } : unit) })) }))
      setFeedback(kind === 'path' ? '培训路径已保存。' : kind === 'course' ? '课程已保存。' : '学习单元已保存。')
      // 保存完成时 saving 仍为 true（finally 会在本段之后执行），必须强制关闭，
      // 否则 close 的并发保护会把成功后的关闭动作拦截掉。
      close(true)
      if (kind === 'course' && !editingCourse) window.location.reload()
      if (kind === 'unit' && !editingUnit) window.location.reload()
      if (kind === 'unit' && (body.mediaId || body.mediaIds)) window.location.reload()
    } catch { setFeedback('网络异常，培训内容保存失败，请稍后重试。') } finally { setSaving(false) }
  }

  const saveHandout = async (formData: FormData) => {
    if (savingHandout) return
    setSavingHandout(true)
    try {
      const file = formData.get('handoutMedia')
      let mediaId = handout.mediaId
      if (file instanceof File && file.size > 0) {
        const upload = new FormData()
        upload.set('title', String(formData.get('handoutTitle') ?? '新人培训手册'))
        if (handout.mediaId) upload.set('previousMediaId', handout.mediaId)
        upload.set('file', file)
        const uploadResponse = await fetch('/api/v1/admin/media', { method: 'POST', headers: { Origin: window.location.origin }, body: upload })
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json().catch(() => ({})) as { message?: string }
          setFeedback(error.message ?? '讲义上传失败，请检查文件格式或存储服务。')
          return
        }
        mediaId = String((await uploadResponse.json() as { id: string | number }).id)
      }
      const title = String(formData.get('handoutTitle') ?? '新人培训手册').trim() || '新人培训手册'
      const summary = String(formData.get('handoutSummary') ?? '').trim()
      const response = await fetch('/api/v1/admin/onboarding-handout', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify({ title, summary, mediaId }) })
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        setFeedback(error.message ?? '讲义设置保存失败，请稍后重试。')
        return
      }
      setHandout((current) => ({ ...current, title, summary, mediaId, mediaUrl: mediaId ? `/api/v1/media/${mediaId}/file` : undefined, updatedAt: new Date().toISOString() }))
      setFeedback('新人培训手册已保存。旧文件将在 7 天后清理。')
    } catch {
      setFeedback('网络异常，讲义设置保存失败，请稍后重试。')
    } finally {
      setSavingHandout(false)
    }
  }

  const toggleCourse = async (course: Course) => {
    const nextActive = course.active === false
    if (!window.confirm(nextActive ? `确定重新启用“${course.title}”吗？` : `确定停用“${course.title}”吗？停用后员工端将不再显示，但历史记录会保留。`)) return
    try {
      const response = await fetch(`/api/v1/admin/training/courses/${course.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify({ title: course.title, summary: course.summary, category: course.category, active: nextActive }) })
      if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '课程状态更新失败，请稍后重试。'); return }
      setPath((current) => ({ ...current, courses: current.courses.map((item) => item.id === course.id ? { ...item, active: nextActive } : item) }))
      setFeedback(nextActive ? '课程已重新启用。' : '课程已停用，员工端将不再显示。')
    } catch { setFeedback('网络异常，课程状态更新失败，请稍后重试。') }
  }

  const defaultDueDays = Math.max(1, Math.round((new Date(path.dueAt).getTime() - new Date(path.assignedAt).getTime()) / 86400000))
  return <>
    <div className="admin-page-actions admin-page-actions--standalone admin-training-toolbar"><label className="compact-select-label admin-training-path-control"><span>当前培训路径</span><select className="form-control" value={path.id} disabled><option value={path.id}>{path.title}</option></select></label><button className="button button--secondary" type="button" onClick={() => openPath(true)}><Pencil size={16} aria-hidden="true" />编辑培训内容</button><button className="button button--primary" type="button" onClick={() => openPath(false)}><Plus size={16} aria-hidden="true" />新建培训路径</button></div>
    {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
    <section className="admin-panel admin-handout-settings" aria-labelledby="handout-settings-heading">
      <div className="panel-heading"><div><h2 id="handout-settings-heading">新人培训手册</h2><p>员工端视频下方显示的配套讲义。上传 HTML 后会替换当前版本，旧文件保留 7 天。</p></div></div>
      <form className="admin-form admin-handout-settings__form" action={saveHandout}>
        <label><span>讲义名称</span><input className="form-control" name="handoutTitle" defaultValue={handout.title} required /></label>
        <label><span>讲义说明</span><input className="form-control" name="handoutSummary" defaultValue={handout.summary} /></label>
        <label><span>替换 HTML 讲义</span><input className="form-control" name="handoutMedia" type="file" accept="text/html,.html,.htm" /><small>{handout.mediaId ? '当前已使用上传文件；不选择文件则只保存名称和说明。' : '当前未上传文件，员工端使用内置讲义；上传后将使用文件内容。'}</small></label>
        <div><button className="button button--primary" type="submit" disabled={savingHandout}>{savingHandout ? '保存中…' : '保存讲义设置'}</button></div>
      </form>
    </section>
    <section className="admin-panel path-editor" aria-labelledby="path-heading"><div className="path-editor__summary"><div className="path-editor__icon"><Layers3 size={22} aria-hidden="true" /></div><div><span className="admin-page-eyebrow">当前培训路径</span><h2 id="path-heading">{path.title}</h2><p>{path.summary || '暂未填写路径说明。'}</p></div><div className="path-editor__meta"><span>{path.progress}% 已完成</span></div></div><div className="path-editor__facts"><span><strong>{path.courseCount}</strong>门课程</span><span><strong>{defaultDueDays}</strong>天默认期限</span><span><strong>{path.completedCourses}</strong>门课程已完成</span></div></section>
    <section className="admin-panel admin-panel--flush" aria-labelledby="course-heading"><div className="panel-heading panel-heading--padded"><div><h2 id="course-heading">课程与单元</h2><p>一门课程可以包含多个学习单元，每个单元可以绑定多个视频或文档。</p></div><button className="button button--secondary" type="button" onClick={() => { setEditingCourse(null); setEditingUnit(null); setUnitCourseId(null); setDialog('course') }}><Plus size={16} aria-hidden="true" />添加课程</button></div><div className="management-list">{path.courses.length ? path.courses.map((course) => <div className="management-row" key={course.id}><span className="management-row__index tabular">{String(course.order).padStart(2, '0')}</span><div className="management-row__body"><strong>{course.title}</strong><p>{course.summary || '暂未填写课程说明。'}</p><div className="course-unit-list"><div className="course-unit-list__header"><span>学习单元（{course.units.length}）</span><button className="table-action" type="button" onClick={() => { setEditingCourse(null); setEditingUnit(null); setUnitCourseId(course.id); setDialog('newUnit') }}><Plus size={14} aria-hidden="true" />新增单元</button></div>{course.units.length ? course.units.map((unit) => <div className="course-unit-list__item" key={unit.id}><span className="course-unit-list__name"><span className="tabular">{String(unit.order).padStart(2, '0')}</span>{unit.title}<small>{unit.type === 'video' ? '视频' : unit.type === 'html' ? 'HTML' : unit.type === 'pdf' ? 'PDF' : unit.type === 'article' ? '图文' : '飞书文档'}{unit.mediaId ? ' · 已绑定资源' : ' · 未绑定资源'}</small></span><button className="table-action" type="button" onClick={() => { setEditingCourse(null); setEditingUnit(unit); setUnitCourseId(course.id); setDialog('unit') }}><Pencil size={14} aria-hidden="true" />编辑</button></div>) : <span className="course-unit-list__empty">暂未添加学习单元</span>}</div></div><span className={`status-badge ${course.active === false ? 'status-badge--muted' : 'status-badge--info'}`}>{course.active === false ? '已停用' : '启用中'}</span><span className="text-muted text-small">{course.unitCount} 个单元</span><div className="management-row__progress"><ProgressBar value={course.progress} label={`${course.title}完成率`} /><span className="tabular">{course.progress}%</span></div><div className="management-row__actions"><button className="table-action" type="button" onClick={() => { setEditingCourse(course); setEditingUnit(null); setUnitCourseId(null); setDialog('course') }}><Pencil size={14} aria-hidden="true" />编辑课程</button><button className="table-action" type="button" onClick={() => void toggleCourse(course)}>{course.active === false ? <RotateCcw size={14} aria-hidden="true" /> : <Archive size={14} aria-hidden="true" />}{course.active === false ? '重新启用' : '停用课程'}</button><Link className="table-action" href={`/admin/training/preview/${course.id}`}><ArrowRight size={14} aria-hidden="true" />管理端预览</Link></div></div>) : <div className="empty-state empty-state--compact"><p>当前路径还没有课程，请先添加课程。</p></div>}</div></section>
    <AdminDialog
      open={Boolean(dialog)}
      title={dialog === 'path' ? (editingPath ? '编辑培训内容' : '新建培训路径') : dialog === 'unit' || dialog === 'newUnit' ? (dialog === 'newUnit' ? '新增学习单元' : '编辑学习单元') : editingCourse ? '编辑课程' : '添加课程'}
      description={dialog === 'unit' || dialog === 'newUnit' ? '每个单元可以绑定一个或多个视频、HTML、PDF 或其他学习资源。' : '保存后会立即写入线上内容库。'}
      size="large"
      onClose={() => close()}
      footer={<><button className="button button--quiet" type="button" onClick={() => close()} disabled={saving}>取消</button><button className="button button--primary" type="submit" form="training-editor-form" disabled={saving}>{saving ? '保存中…' : dialog === 'path' && !editingPath ? '创建路径' : '保存修改'}</button></>}
    >
      {dialog ? <form key={`${dialog}-${editingPath}-${editingCourse?.id ?? ''}-${editingUnit?.id ?? ''}-${unitCourseId ?? ''}`} className="admin-form" id="training-editor-form" action={save}>{dialog === 'path' ? <><label><span>路径名称</span><input className="form-control" name="title" defaultValue={editingPath ? path.title : ''} required /></label><label><span>路径说明</span><textarea className="form-control" name="summary" defaultValue={editingPath ? path.summary : ''} rows={3} /></label><label><span>默认期限（天）</span><input className="form-control" name="dueDays" type="number" min="1" max="365" defaultValue={defaultDueDays} required /></label></> : dialog === 'unit' || dialog === 'newUnit' ? <><label><span>单元名称</span><input className="form-control" name="title" defaultValue={editingUnit?.title ?? ''} required /></label><label><span>单元说明</span><textarea className="form-control" name="summary" defaultValue={editingUnit?.description ?? ''} rows={3} /></label><label><span>单元类型</span><select className="form-control" name="unitType" defaultValue={editingUnit?.type ?? 'video'}><option value="video">视频</option><option value="html">HTML 讲义</option><option value="article">图文</option><option value="pdf">PDF</option><option value="feishuDoc">飞书文档</option></select></label><label><span>单元资源（可选）</span><input className="form-control" name="media" type="file" multiple accept="text/html,.html,text/markdown,.md,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp" /><small>{editingUnit?.mediaId ? '不选择文件则保留当前资源；选择新文件会追加到当前资源列表，旧资源继续保留。' : '可一次上传多个视频、HTML、PDF 或文档资源。'}</small></label></> : <><label><span>课程名称</span><input className="form-control" name="title" defaultValue={editingCourse?.title ?? ''} required /></label><label><span>课程说明</span><textarea className="form-control" name="summary" defaultValue={editingCourse?.summary ?? ''} rows={3} /></label><label><span>课程分类</span><input className="form-control" name="category" defaultValue={editingCourse?.category ?? '新员工必看'} /></label>{!editingCourse ? <div className="admin-form__grid"><label><span>第一个单元（可选）</span><input className="form-control" name="unitTitle" /></label><label><span>单元类型</span><select className="form-control" name="unitType" defaultValue="video"><option value="video">视频</option><option value="html">HTML 讲义</option><option value="article">图文</option><option value="pdf">PDF</option><option value="feishuDoc">飞书文档</option></select></label><label><span>第一个单元资源（可选）</span><input className="form-control" name="media" type="file" multiple accept="text/html,.html,application/markdown,text/markdown,.md,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp" /></label></div> : null}</>}</form> : null}
      {dialog === 'unit' && editingUnit?.resources?.length ? <div className="resource-editor" aria-label="当前单元资源">
        <span>当前资源</span>
        <div className="resource-editor__list">
          {editingUnit.resources.map((resource) => retainedMediaIds.includes(resource.id) ? <div className="resource-editor__item" key={resource.id}>
            <span title={resource.filename || resource.title}>{resource.filename || resource.title}</span>
            <div className="resource-editor__actions">
              <a className="table-action" href={resource.url} target="_blank" rel="noreferrer">预览</a>
              <button className="table-icon-button" type="button" aria-label={`移除资源 ${resource.title}`} onClick={() => setRetainedMediaIds((current) => current.filter((id) => id !== resource.id))}><Trash2 size={15} aria-hidden="true" /></button>
            </div>
          </div> : null)}
        </div>
        <small>“预览”会在新标签页打开资源；移除只解除当前单元关联，不会立即删除文件。</small>
      </div> : null}
    </AdminDialog>
  </>
}
