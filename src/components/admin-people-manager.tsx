'use client'

import { CalendarClock, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import { useFeishuOrganization } from '@/lib/use-feishu-organization'
import type { FeishuOrganization, LearningPath, TrainingRecord } from '@/lib/types'

export interface AdminPeopleManagerProps {
  initialRecords: TrainingRecord[]
  initialOrganization: FeishuOrganization
  availablePaths: LearningPath[]
}

const getDefaultDueDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function AdminPeopleManager({ initialRecords, initialOrganization, availablePaths }: AdminPeopleManagerProps) {
  const [records, setRecords] = useState(initialRecords)
  const { organization, syncing, sync } = useFeishuOrganization(initialOrganization)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [assignOpen, setAssignOpen] = useState(false)
  const [adjustRecord, setAdjustRecord] = useState<TrainingRecord | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [departmentQuery, setDepartmentQuery] = useState('')
  const [feedback, setFeedback] = useState('')
  const [departmentSavingId, setDepartmentSavingId] = useState<string | null>(null)
  const [departmentName, setDepartmentName] = useState('')
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')

  const visibleRecords = useMemo(() => records.filter((record) => {
    const matchesQuery = !query || `${record.userName} ${record.departmentName}`.toLowerCase().includes(query.toLowerCase())
    const matchesDepartment = department === 'all' || record.departmentName === department
    return matchesQuery && matchesDepartment
  }), [department, query, records])

  const normalizedEmployeeQuery = employeeQuery.trim().toLocaleLowerCase('zh-CN')
  const visibleEmployees = organization.employees.filter((employee) => !normalizedEmployeeQuery || `${employee.name} ${employee.departmentName} ${employee.email ?? ''}`.toLocaleLowerCase('zh-CN').includes(normalizedEmployeeQuery))
  const normalizedDepartmentQuery = departmentQuery.trim().toLocaleLowerCase('zh-CN')
  const visibleDepartmentEmployees = organization.employees.filter((employee) => !normalizedDepartmentQuery || `${employee.name} ${employee.departmentName} ${employee.email ?? ''}`.toLocaleLowerCase('zh-CN').includes(normalizedDepartmentQuery))

  const closeAssignDialog = () => {
    setAssignOpen(false)
    setEmployeeQuery('')
  }

  const assignTraining = async (formData: FormData) => {
    const pathId = String(formData.get('pathId') ?? initialRecords[0]?.pathId ?? '')
    const dueAt = String(formData.get('dueAt') ?? getDefaultDueDate())
    if (!selectedEmployeeIds.length) {
      setFeedback('请至少选择一名员工。')
      return
    }
    if (!pathId) {
      setFeedback('当前没有可分配的培训路径，请先在内容后台发布并配置默认路径。')
      return
    }
    try {
      const response = await fetch('/api/v1/admin/enrollments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ userIds: selectedEmployeeIds, learningPathId: pathId, dueAt: new Date(`${dueAt}T23:59:59`).toISOString() }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        setFeedback(error.message ?? '培训分配失败，请稍后重试。')
        return
      }
      window.location.reload()
    } catch {
      setFeedback('网络异常，培训分配失败，请稍后重试。')
    }
  }

  const adjustAssignment = async (formData: FormData) => {
    if (!adjustRecord) return
    const dueAt = String(formData.get('dueAt') ?? adjustRecord.dueAt)
    if (!adjustRecord.enrollmentId) {
      setFeedback('缺少培训记录标识，请刷新页面后重试。')
      return
    }
    try {
      const response = await fetch(`/api/v1/admin/enrollments/${adjustRecord.enrollmentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueAt: new Date(`${dueAt}T23:59:59`).toISOString() }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        setFeedback(error.message ?? '调整失败，请稍后重试。')
        return
      }
      setRecords((current) => current.map((record) => record.enrollmentId === adjustRecord.enrollmentId ? { ...record, dueAt } : record))
      setAdjustRecord(null)
      setFeedback(`已调整 ${adjustRecord.userName} 的培训分配，不影响已有学习进度。`)
    } catch {
      setFeedback('网络异常，调整失败，请稍后重试。')
    }
  }

  const updateDepartment = async (userId: string, departmentId: string) => {
    setDepartmentSavingId(userId)
    const response = await fetch(`/api/v1/admin/users/${userId}/department`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ departmentId: departmentId === 'unassigned' ? null : departmentId }),
    })
    setDepartmentSavingId(null)
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string }
      setFeedback(error.message ?? '部门调整失败，请稍后重试。')
      return
    }
    await sync()
    const employee = organization.employees.find((item) => item.id === userId)
    setFeedback(`已更新${employee?.name ?? '员工'}的部门。`)
  }

  const saveDepartment = async () => {
    const name = departmentName.trim()
    if (!name) return setFeedback('请填写部门名称。')
    const response = await fetch(editingDepartmentId ? `/api/v1/admin/departments/${editingDepartmentId}` : '/api/v1/admin/departments', {
      method: editingDepartmentId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '部门保存失败，请稍后重试。'); return }
    setDepartmentName(''); setEditingDepartmentId(null); await sync(); setFeedback(`已${editingDepartmentId ? '修改' : '新增'}部门。`)
  }

  const removeDepartment = async (id: string, name: string) => {
    if (!window.confirm(`确定删除“${name}”吗？已分配员工的部门不能删除。`)) return
    const response = await fetch(`/api/v1/admin/departments/${id}`, { method: 'DELETE', headers: { Origin: window.location.origin } })
    if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; setFeedback(error.message ?? '部门删除失败，请稍后重试。'); return }
    await sync(); setFeedback(`已删除部门“${name}”。`)
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone">
        <button className="button button--primary" type="button" onClick={() => {
          setEmployeeQuery('')
          setAssignOpen(true)
        }}><Plus size={16} aria-hidden="true" />分配培训</button>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <div className="admin-filters admin-filters--compact">
        <label className="admin-search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名或部门" /></label>
        <label><span>部门 · {syncing ? '同步中' : '飞书组织架构'}</span><select className="form-control" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">全部部门</option>{organization.departments.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
      </div>
      <section className="admin-panel department-manager" aria-label="员工部门归属">
        <div className="settings-panel__heading"><div><h2>员工部门</h2><p>调整后会保存到系统组织架构，不影响培训进度。</p></div><span className="definition-note">共 {organization.employees.length} 人</span></div>
        <label className="admin-search-field department-manager__search"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索员工</span><input type="search" value={departmentQuery} onChange={(event) => setDepartmentQuery(event.target.value)} placeholder="搜索姓名、邮箱或当前部门" /></label>
        <div className="department-manager__table-wrap">
          <table className="data-table department-manager__table">
            <thead><tr><th>员工</th><th>当前部门</th><th>分配部门</th></tr></thead>
            <tbody>
              {visibleDepartmentEmployees.map((employee) => <tr key={employee.id}>
                <td><strong>{employee.name}</strong><small>{employee.email ?? '未填写邮箱'}</small></td>
                <td>{employee.departmentName || '未分配部门'}</td>
                <td><select className="form-control" value={employee.departmentIds[0] ?? 'unassigned'} disabled={departmentSavingId === employee.id} onChange={(event) => void updateDepartment(employee.id, event.target.value)}>
                  <option value="unassigned">未分配部门</option>
                  {organization.departments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select></td>
              </tr>)}
              {!visibleDepartmentEmployees.length ? <tr><td colSpan={3}><p className="employee-picker__empty" role="status">没有找到匹配的员工</p></td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel department-manager department-catalog" aria-label="部门管理">
        <div className="settings-panel__heading"><div><h2>部门管理</h2><p>维护可分配给员工的部门。删除前需要先移走该部门的员工。</p></div></div>
        <div className="department-catalog__form"><select className="form-control" value={selectedDepartmentId} onChange={(event) => setSelectedDepartmentId(event.target.value)}><option value="">选择已有部门</option>{organization.departments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>{selectedDepartmentId ? <><button className="table-icon-button" type="button" aria-label="编辑所选部门" onClick={() => { const item = organization.departments.find((department) => department.id === selectedDepartmentId); if (item) { setEditingDepartmentId(item.id); setDepartmentName(item.name) } }}><Pencil size={15} aria-hidden="true" /></button><button className="table-icon-button" type="button" aria-label="删除所选部门" onClick={() => { const item = organization.departments.find((department) => department.id === selectedDepartmentId); if (item) void removeDepartment(item.id, item.name) }}><Trash2 size={15} aria-hidden="true" /></button></> : null}<input className="form-control" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder={editingDepartmentId ? '修改部门名称' : '输入新部门名称'} /><button className="button button--primary" type="button" onClick={() => void saveDepartment()}>{editingDepartmentId ? '保存修改' : '新增部门'}</button>{editingDepartmentId ? <button className="button button--quiet" type="button" onClick={() => { setEditingDepartmentId(null); setDepartmentName('') }}>取消</button> : null}</div>
      </section>
      <p className="definition-note definition-note--block"><CalendarClock size={14} aria-hidden="true" />“调整分配”用于修改截止日期或追加课程，不会清空员工已有学习进度。</p>
      <section className="admin-panel admin-panel--flush" aria-label="员工分配列表">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>员工</th><th>部门</th><th>路径</th><th>截止时间</th><th>状态</th><th>进度</th><th>最高分</th><th>操作</th></tr></thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.userId}>
                  <td><strong>{record.userName}</strong></td>
                  <td>{record.departmentName}</td>
                  <td>{record.pathTitle}</td>
                  <td><span className="inline-icon"><CalendarClock size={14} aria-hidden="true" />{formatDate(record.dueAt)}</span></td>
                  <td><StatusBadge status={record.status} /></td>
                  <td className="tabular">{record.videoProgress}%</td>
                  <td className="tabular">{record.bestScore ?? '—'}</td>
                  <td><button className="table-button" type="button" onClick={() => setAdjustRecord(record)}>调整分配</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDialog
        open={assignOpen}
        title="分配培训"
        description="人员来自飞书组织架构，可一次选择多人。"
        size="large"
        onClose={closeAssignDialog}
        footer={<><button className="button button--quiet" type="button" onClick={closeAssignDialog}>取消</button><button className="button button--primary" type="submit" form="assign-training-form">确认分配</button></>}
      >
        <form className="admin-form" id="assign-training-form" action={assignTraining}>
          <div className="admin-form__grid">
            <label><span>培训路径</span><select className="form-control" name="pathId" defaultValue={initialRecords[0]?.pathId ?? availablePaths[0]?.id} required>{availablePaths.map((path) => <option value={path.id} key={path.id}>{path.title}</option>)}</select></label>
          </div>
          <label><span>截止日期</span><input className="form-control" name="dueAt" type="date" defaultValue={getDefaultDueDate()} required /></label>
          <fieldset className="employee-picker">
            <legend>选择员工（已选 {selectedEmployeeIds.length} 人）</legend>
            <label className="admin-search-field employee-picker__search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">搜索员工</span>
              <input type="search" value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} placeholder="搜索姓名、部门或邮箱" />
            </label>
            <div className="employee-picker__list">
              {visibleEmployees.map((employee) => <label key={employee.id}><input type="checkbox" checked={selectedEmployeeIds.includes(employee.id)} onChange={() => setSelectedEmployeeIds((current) => current.includes(employee.id) ? current.filter((id) => id !== employee.id) : [...current, employee.id])} /><span><strong>{employee.name}</strong><small>{employee.departmentName}</small></span></label>)}
              {!visibleEmployees.length ? <p className="employee-picker__empty" role="status">没有找到匹配的员工</p> : null}
            </div>
          </fieldset>
        </form>
      </AdminDialog>

      <AdminDialog
        open={Boolean(adjustRecord)}
        title="调整员工培训"
        description="修改截止日期或追加课程，不会清空已有进度与答题记录。"
        onClose={() => setAdjustRecord(null)}
        footer={adjustRecord ? <><button className="button button--quiet" type="button" onClick={() => setAdjustRecord(null)}>取消</button><button className="button button--primary" type="submit" form="adjust-training-form">保存调整</button></> : null}
      >
        {adjustRecord ? <form className="admin-form" id="adjust-training-form" action={adjustAssignment}>
          <div className="selected-person"><strong>{adjustRecord.userName}</strong><span>{adjustRecord.departmentName} · {adjustRecord.pathTitle}</span></div>
          <label><span>截止日期</span><input className="form-control" name="dueAt" type="date" defaultValue={adjustRecord.dueAt} required /></label>
          <label><span>当前课程</span><input className="form-control" value={adjustRecord.courseTitle} disabled /></label>
        </form> : null}
      </AdminDialog>
    </>
  )
}
