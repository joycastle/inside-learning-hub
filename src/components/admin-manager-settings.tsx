'use client'

import { ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useFeishuOrganization } from '@/lib/use-feishu-organization'
import type { FeishuOrganization } from '@/lib/types'

export interface AdminManagerSettingsProps {
  initialOrganization: FeishuOrganization
  currentUserId: string
}

export function AdminManagerSettings({ initialOrganization, currentUserId }: AdminManagerSettingsProps) {
  const { organization, syncing, sync } = useFeishuOrganization(initialOrganization)
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState('')

  const admins = organization.employees.filter((employee) => employee.role === 'admin' || employee.role === 'superAdmin')
  const candidates = organization.employees.filter((employee) => employee.role === 'employee')

  const changeRole = async (userId: string, role: 'employee' | 'admin') => {
    const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string }
      setFeedback(error.message ?? '角色变更失败，请稍后重试。')
      return false
    }
    await sync()
    return true
  }

  const addAdmin = async () => {
    if (!selectedId) return
    const employee = organization.employees.find((item) => item.id === selectedId)
    if (!await changeRole(selectedId, 'admin')) return
    setSelectedId('')
    setFeedback(employee ? `已将 ${employee.name} 设置为管理员。` : '管理员已添加。')
  }

  return (
    <section className="admin-panel settings-panel settings-panel--wide">
      <div className="settings-panel__heading"><div><h2>管理员配置</h2><p>从飞书通讯录选择人员，授予管理端访问权限</p></div><ShieldCheck size={20} aria-hidden="true" /></div>
      <div className="admin-manager-controls">
        <label><span>飞书人员</span><select className="form-control" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">请选择人员</option>{candidates.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} · {employee.departmentName}</option>)}</select></label>
        <button className="button button--secondary" type="button" disabled={!selectedId} onClick={() => void addAdmin()}><UserPlus size={16} aria-hidden="true" />设为管理员</button>
        <button className="button button--quiet" type="button" onClick={() => void sync()}>{syncing ? '同步中…' : '同步飞书人员'}</button>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <div className="admin-manager-list">
        {admins.map((employee) => <div key={employee.id}><span><strong>{employee.name}</strong><small>{employee.departmentName} · {employee.role === 'superAdmin' ? '超级管理员' : '管理员'}</small></span>{employee.id !== currentUserId && employee.role !== 'superAdmin' ? <button className="table-icon-button" type="button" aria-label={`取消 ${employee.name} 的管理员权限`} onClick={() => void changeRole(employee.id, 'employee').then((changed) => {
          if (changed) setFeedback(`已取消 ${employee.name} 的管理员权限。`)
        })}><Trash2 size={15} aria-hidden="true" /></button> : <span className="publish-state">{employee.id === currentUserId ? '当前账号' : '受保护'}</span>}</div>)}
      </div>
    </section>
  )
}
