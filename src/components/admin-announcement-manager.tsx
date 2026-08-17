'use client'

import { Megaphone, Plus } from 'lucide-react'
import { useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'

export interface ManagedAnnouncement {
  id?: string
  title: string
  summary?: string
  audience: string
  audienceValue?: 'all' | 'newEmployees' | 'departments'
  targetUrl?: string
  publishedAt: string
  status: '已发布' | '草稿'
}

export function AdminAnnouncementManager({ initialAnnouncements }: { initialAnnouncements: ManagedAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [editing, setEditing] = useState<ManagedAnnouncement | null>(null)
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const save = async (formData: FormData) => {
    const title = String(formData.get('title') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    const audience = String(formData.get('audience') ?? 'all')
    const targetUrl = String(formData.get('targetUrl') ?? '').trim()
    const status = String(formData.get('status') ?? 'draft') as '已发布' | '草稿'
    if (!title) { setFeedback('请填写公告标题。'); return }
    const response = await fetch('/api/admin/announcements', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing?.id, title, summary, audience, targetUrl, status }) })
    if (!response.ok) { setFeedback('公告保存失败，请稍后重试。'); return }
    const result = await response.json() as { id?: string }
    const next = { id: result.id ?? editing?.id, title, summary, targetUrl, audience: audience === 'newEmployees' ? '近 30 天入职员工' : audience === 'departments' ? '指定部门' : '全员', audienceValue: audience as 'all' | 'newEmployees' | 'departments', publishedAt: status === '已发布' ? new Date().toISOString() : '—', status }
    setAnnouncements((current) => editing ? current.map((item) => item.id === editing.id ? next : item) : [next, ...current])
    setEditing(null); setOpen(false); setFeedback(`公告已${editing ? '更新' : '保存'}。`)
  }
  return <>
    <div className="admin-page-actions admin-page-actions--standalone"><button className="button button--primary" type="button" onClick={() => { setEditing(null); setOpen(true) }}><Plus size={16} aria-hidden="true" />新建公告</button></div>
    {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
    <section className="admin-panel admin-panel--flush" aria-label="公告列表"><div className="announcement-list">{announcements.map((announcement, index) => <div className="announcement-row" key={announcement.id ?? announcement.title}><span className="announcement-row__icon"><Megaphone size={18} aria-hidden="true" /></span><div><strong>{announcement.title}</strong><p>展示人群：{announcement.audience} · 发布时间：{announcement.publishedAt === '—' ? '—' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(announcement.publishedAt))}</p></div><span className={announcement.status === '草稿' ? 'draft-state' : 'publish-state'}>{announcement.status}</span><button className="table-button" type="button" aria-label={`编辑${announcement.title}`} onClick={() => { setEditing(announcement); setOpen(true) }}>编辑</button><span className="tabular text-muted text-small">{String(index + 1).padStart(2, '0')}</span></div>)}</div></section>
    <AdminDialog open={open} title={editing ? '编辑公告' : '新建公告'} description="公告会根据受众和有效期显示在员工首页。" onClose={() => { setOpen(false); setEditing(null) }}>
      <form className="admin-form" action={save}><label><span>标题</span><input className="form-control" name="title" defaultValue={editing?.title ?? ''} placeholder="例如：差旅与费用报销规范已更新" /></label><label><span>摘要</span><textarea className="form-control" name="summary" rows={3} defaultValue={editing?.summary ?? ''} placeholder="填写公告摘要" /></label><label><span>展示人群</span><select className="form-control" name="audience" defaultValue={editing?.audienceValue ?? (editing?.audience === '近 30 天入职员工' ? 'newEmployees' : editing?.audience === '指定部门' ? 'departments' : 'all')}><option value="all">全员</option><option value="newEmployees">近 30 天入职员工</option><option value="departments">指定部门</option></select></label><label><span>目标链接（可选）</span><input className="form-control" name="targetUrl" defaultValue={editing?.targetUrl ?? ''} placeholder="/services/…" /></label><label><span>状态</span><select className="form-control" name="status" defaultValue={editing?.status ?? '草稿'}><option value="草稿">保存草稿</option><option value="已发布">立即发布</option></select></label><div className="admin-dialog__footer admin-dialog__footer--inline"><button className="button button--quiet" type="button" onClick={() => setOpen(false)}>取消</button><button className="button button--primary" type="submit">保存公告</button></div></form>
    </AdminDialog>
  </>
}
