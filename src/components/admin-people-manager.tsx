'use client'

import { CalendarClock, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import { useFeishuOrganization } from '@/lib/use-feishu-organization'
import { useStoredState } from '@/lib/use-stored-state'
import type { FeishuOrganization, TrainingRecord } from '@/lib/types'

export interface AdminPeopleManagerProps {
  initialRecords: TrainingRecord[]
  initialOrganization: FeishuOrganization
}

const getDefaultDueDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function AdminPeopleManager({ initialRecords, initialOrganization }: AdminPeopleManagerProps) {
  const [records, setRecords] = useStoredState<TrainingRecord[]>('admin-training-records-v1', initialRecords)
  const { organization, syncing } = useFeishuOrganization(initialOrganization)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [assignOpen, setAssignOpen] = useState(false)
  const [adjustRecord, setAdjustRecord] = useState<TrainingRecord | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [feedback, setFeedback] = useState('')

  const visibleRecords = useMemo(() => records.filter((record) => {
    const matchesQuery = !query || `${record.userName} ${record.departmentName}`.toLowerCase().includes(query.toLowerCase())
    const matchesDepartment = department === 'all' || record.departmentName === department
    return matchesQuery && matchesDepartment
  }), [department, query, records])

  const normalizedEmployeeQuery = employeeQuery.trim().toLocaleLowerCase('zh-CN')
  const visibleEmployees = organization.employees.filter((employee) => !normalizedEmployeeQuery || `${employee.name} ${employee.departmentName} ${employee.email ?? ''}`.toLocaleLowerCase('zh-CN').includes(normalizedEmployeeQuery))

  const closeAssignDialog = () => {
    setAssignOpen(false)
    setEmployeeQuery('')
  }

  const assignTraining = (formData: FormData) => {
    const pathTitle = String(formData.get('pathTitle') ?? '新员工入职学习路径')
    const courseTitle = String(formData.get('courseTitle') ?? '新人入职说明')
    const dueAt = String(formData.get('dueAt') ?? getDefaultDueDate())
    if (!selectedEmployeeIds.length) {
      setFeedback('请至少选择一名员工。')
      return
    }
    const selectedEmployees = organization.employees.filter((employee) => selectedEmployeeIds.includes(employee.id))
    setRecords((current) => {
      const existingIds = new Set(current.map((record) => record.userId))
      const updated = current.map((record) => selectedEmployeeIds.includes(record.userId) ? {
        ...record,
        pathTitle,
        courseTitle,
        dueAt,
      } : record)
      const additions: TrainingRecord[] = selectedEmployees.filter((employee) => !existingIds.has(employee.id)).map((employee) => ({
        userId: employee.id,
        userName: employee.name,
        departmentName: employee.departmentName,
        pathTitle,
        courseTitle,
        assignedAt: new Date().toISOString().slice(0, 10),
        dueAt,
        status: 'notStarted',
        videoProgress: 0,
        attempts: 0,
      }))
      return [...updated, ...additions]
    })
    closeAssignDialog()
    setFeedback(`已向 ${selectedEmployeeIds.length} 名员工分配培训。`)
    setSelectedEmployeeIds([])
  }

  const adjustAssignment = (formData: FormData) => {
    if (!adjustRecord) return
    const dueAt = String(formData.get('dueAt') ?? adjustRecord.dueAt)
    const courseTitle = String(formData.get('courseTitle') ?? adjustRecord.courseTitle)
    setRecords((current) => current.map((record) => record.userId === adjustRecord.userId ? { ...record, dueAt, courseTitle } : record))
    setAdjustRecord(null)
    setFeedback(`已调整 ${adjustRecord.userName} 的培训分配，不影响已有学习进度。`)
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
      <p className="definition-note definition-note--block"><CalendarClock size={14} aria-hidden="true" />“调整分配”用于修改截止日期或追加课程，不会清空员工已有学习进度。</p>
      <section className="admin-panel admin-panel--flush" aria-label="员工分配列表">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>员工</th><th>部门</th><th>路径</th><th>截止时间</th><th>状态</th><th>进度</th><th>最高分</th><th>操作</th></tr></thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.userId}>
                  <td><strong>{record.userName}</strong><small>{record.userId}</small></td>
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
            <label><span>培训路径</span><select className="form-control" name="pathTitle" defaultValue="新员工入职学习路径"><option>新员工入职学习路径</option></select></label>
            <label><span>课程</span><select className="form-control" name="courseTitle" defaultValue="新人入职说明"><option>新人入职说明</option><option>信息安全基础</option></select></label>
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
          <label><span>当前 / 追加课程</span><select className="form-control" name="courseTitle" defaultValue={adjustRecord.courseTitle}><option>新人入职说明</option><option>信息安全基础</option><option>员工制度必读</option></select></label>
        </form> : null}
      </AdminDialog>
    </>
  )
}
