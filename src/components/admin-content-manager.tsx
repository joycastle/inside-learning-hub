'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'

type Collection = 'announcements' | 'knowledge-articles'
type Item = { id: string | number; title?: string; slug?: string; summary?: string; body?: string; html?: string; externalUrl?: string; _status?: string; updatedAt?: string }

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `service-${Date.now()}`

export function AdminContentManager({ collection, initialItems, emptyText }: { collection: Collection; initialItems: Item[]; emptyText: string }) {
  const [items, setItems] = useState(initialItems)
  const [editing, setEditing] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const isArticle = collection === 'knowledge-articles'

  const openNew = () => setEditing(isArticle ? { id: '', title: '', slug: '', summary: '', body: '', externalUrl: '' } : { id: '', title: '', summary: '', body: '' })
  const save = async (formData: FormData) => {
    if (!editing || saving) return
    setSaving(true)
    const body = {
      title: String(formData.get('title') ?? '').trim(),
      slug: editing.slug?.trim() || slugify(String(formData.get('title') ?? '')),
      summary: String(formData.get('summary') ?? '').trim(),
      body: String(formData.get('body') ?? '').trim(),
      html: String(formData.get('html') ?? '').trim(),
      externalUrl: String(formData.get('externalUrl') ?? '').trim(),
      active: true,
    }
    try {
      const response = await fetch(editing.id ? `/api/v1/admin/content/${collection}/${editing.id}` : `/api/v1/admin/content/${collection}`, { method: editing.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify(body) })
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        setFeedback(error.message ?? '保存失败，请稍后重试。')
        return
      }
      const saved = await response.json() as Item
      setItems((current) => editing.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
      setEditing(null)
      setFeedback('内容已保存。')
    } catch {
      setFeedback('网络异常，保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <div className="admin-page-actions admin-page-actions--standalone"><button className="button button--primary" type="button" onClick={openNew}><Plus size={16} aria-hidden="true" />{isArticle ? '新建服务内容' : '新建公告'}</button></div>
    {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
    <section className="admin-panel admin-panel--flush"><div className="management-list">{items.length ? items.map((item) => <div className="management-row management-row--simple" key={item.id}><div className="management-row__body"><strong>{item.title ?? '未命名内容'}</strong><p>{item.summary ?? item.slug ?? '暂无摘要'}</p></div><button className="table-action" type="button" onClick={() => setEditing(item)}>编辑</button></div>) : <div className="empty-state empty-state--compact"><p>{emptyText}</p></div>}</div></section>
    <AdminDialog open={Boolean(editing)} title={editing?.id ? '编辑内容' : isArticle ? '新建服务内容' : '新建公告'} description="保存后会立即同步到员工端。" size="large" density="compact" onClose={() => !saving && setEditing(null)} footer={<><button className="button button--quiet" type="button" onClick={() => setEditing(null)} disabled={saving}>取消</button><button className="button button--primary" type="submit" form="content-editor-form" disabled={saving}>{saving ? '保存中…' : '保存内容'}</button></>}>
      {editing ? <form className="admin-form" id="content-editor-form" action={save}><label><span>标题</span><input className="form-control" name="title" value={editing.title ?? ''} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required /></label><label><span>摘要</span><textarea className="form-control" name="summary" value={editing.summary ?? ''} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} required /></label><label><span>{isArticle ? '正文（纯文本）' : '公告正文'}</span><textarea className="form-control" name="body" value={editing.body ?? ''} onChange={(event) => setEditing({ ...editing, body: event.target.value })} required={!isArticle} /></label>{isArticle ? <label><span>外部链接（可选）</span><input className="form-control" name="externalUrl" value={editing.externalUrl ?? ''} onChange={(event) => setEditing({ ...editing, externalUrl: event.target.value })} /></label> : null}</form> : null}
    </AdminDialog>
  </>
}
