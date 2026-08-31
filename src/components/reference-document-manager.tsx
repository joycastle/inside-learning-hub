'use client'

import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'

type MediaValue = { id?: string | number; filename?: string; mimeType?: string } | string | number | null
type ReferenceDocumentItem = { id: string | number; title?: string; slug?: string; summary?: string; tags?: unknown[]; media?: unknown; required?: boolean; isReferenceDocument?: boolean; updatedAt?: string }

const mediaIdOf = (media: unknown) => {
  if (media && typeof media === 'object' && 'id' in media) return (media as { id?: string | number }).id
  return typeof media === 'string' || typeof media === 'number' ? media : undefined
}
const fileTypeOf = (media: unknown) => {
  const name = typeof media === 'object' && media ? String((media as MediaValue & { filename?: string }).filename ?? '').toLowerCase() : ''
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'HTML'
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'Markdown'
  if (name.endsWith('.pdf')) return 'PDF'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word'
  if (name.endsWith('.mp4')) return '视频'
  return '文档'
}

export function ReferenceDocumentManager({ initialItems }: { initialItems: ReferenceDocumentItem[] }) {
  const [items, setItems] = useState(initialItems.filter((item) => item.isReferenceDocument === true))
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ReferenceDocumentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const submitting = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visibleItems = useMemo(() => items.filter((item) => `${item.title ?? ''} ${item.summary ?? ''}`.toLocaleLowerCase('zh-CN').includes(query.trim().toLocaleLowerCase('zh-CN'))), [items, query])

  const openNew = () => { setSelectedFile(null); setEditing({ id: '', title: '', summary: '', tags: [], required: false, media: null }) }
  const save = async (formData: FormData) => {
    if (!editing || saving || submitting.current) return
    submitting.current = true
    setSaving(true)
    try {
      const formFile = formData.get('file')
      const file = selectedFile && selectedFile.size > 0 ? selectedFile : formFile instanceof File && formFile.size > 0 ? formFile : fileInputRef.current?.files?.[0]
      let media = mediaIdOf(editing.media)
      if (file instanceof File && file.size > 0) {
        const upload = new FormData()
        upload.set('title', String(formData.get('title') ?? '参考文档'))
        if (media) upload.set('previousMediaId', String(media))
        upload.set('file', file)
        const uploadResponse = await fetch('/api/v1/admin/media', { method: 'POST', headers: { Origin: window.location.origin }, body: upload })
        if (!uploadResponse.ok) throw new Error('文档上传失败，请检查文件格式或存储服务。')
        media = String((await uploadResponse.json() as { id: string | number }).id)
      }
      const title = String(formData.get('title') ?? '').trim()
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document'
      const slug = editing.id ? editing.slug : `reference-${baseSlug}-${Date.now()}`
      const body = { title, slug: slug || `reference-${baseSlug}-${Date.now()}`, summary: String(formData.get('summary') ?? '').trim(), tags: String(formData.get('tags') ?? '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean), required: formData.get('required') === 'on', isReferenceDocument: true, ...(media ? { media: Number(media) } : {}) }
      const response = await fetch(editing.id ? `/api/v1/admin/content/knowledge-articles/${editing.id}` : '/api/v1/admin/content/knowledge-articles', { method: editing.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Origin: window.location.origin }, body: JSON.stringify(body) })
      if (!response.ok) throw new Error('文档保存失败，请稍后重试。')
      const saved = await response.json() as ReferenceDocumentItem
      setItems((current) => editing.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
      setEditing(null)
      setSelectedFile(null)
      setFeedback('参考文档已保存。')
    } catch (error) { setFeedback(error instanceof Error ? error.message : '文档保存失败，请稍后重试。') } finally { setSaving(false); submitting.current = false }
  }

  const remove = async (item: ReferenceDocumentItem) => {
    if (!window.confirm(`确定删除“${item.title ?? '这份文档'}”吗？删除后员工端将不再显示。`)) return
    const response = await fetch(`/api/v1/admin/content/knowledge-articles/${item.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } })
    const result = await response.json().catch(() => ({})) as { message?: string }
    if (!response.ok) { setFeedback(result.message ?? '文档删除失败，请稍后重试。'); return }
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    setFeedback('参考文档已删除。')
  }

  return <>
    <div className="admin-page-actions admin-page-actions--standalone"><button className="button button--primary" type="button" onClick={openNew}><Plus size={16} aria-hidden="true" />新增参考文档</button></div>
    {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
    <section className="admin-filters admin-filters--compact"><label className="admin-search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索参考文档</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文档标题、说明或标签" /></label><span className="admin-filter-result">共 {visibleItems.length} 份文档</span></section>
    <section className="admin-panel admin-panel--flush"><div className="management-list">{visibleItems.length ? visibleItems.map((item) => <div className="management-row management-row--simple reference-document-management-row" key={item.id}><FileText className="reference-document-management-row__icon" size={20} aria-hidden="true" /><div className="management-row__body"><strong>{item.title}</strong><p>{item.summary || '暂无说明'} · {fileTypeOf(item.media)}</p></div>{item.required ? <span className="status-badge status-badge--info">必读</span> : null}<div className="management-row__actions"><button className="table-action" type="button" onClick={() => setEditing(item)}><Pencil size={14} aria-hidden="true" />编辑</button><button className="table-action table-action--danger" type="button" onClick={() => void remove(item)}><Trash2 size={14} aria-hidden="true" />删除</button></div></div>) : <div className="empty-state empty-state--compact"><p>暂无参考文档。</p></div>}</div></section>
    <AdminDialog open={Boolean(editing)} title={editing?.id ? '编辑参考文档' : '新增参考文档'} description="新人可以从参考文档入口直接阅读，不依附培训课程。" size="large" onClose={() => !saving && setEditing(null)} footer={<><button className="button button--quiet" type="button" onClick={() => setEditing(null)} disabled={saving}>取消</button><button className="button button--primary" type="submit" form="reference-document-form" disabled={saving}>{saving ? '保存中…' : '保存文档'}</button></>}>{editing ? <form className="admin-form" id="reference-document-form" onSubmit={(event) => { event.preventDefault(); void save(new FormData(event.currentTarget)) }}><label><span>文档标题</span><input className="form-control" name="title" defaultValue={editing.title} required /></label><label><span>文档说明</span><textarea className="form-control" name="summary" defaultValue={editing.summary} rows={3} required /></label><label><span>标签（可选）</span><input className="form-control" name="tags" defaultValue={(editing.tags ?? []).map(String).join('，')} placeholder="制度，流程，工具" /></label><label><span>替换文件</span><input ref={fileInputRef} className="form-control" name="file" type="file" accept=".md,.markdown,.html,.htm,.pdf,.doc,.docx,.mp4,image/*" onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)} /><small>{mediaIdOf(editing.media) ? '不选择文件则保留当前文件；上传新文件会立即切换，旧文件保留 7 天。' : '支持单个 Markdown、HTML、PDF、Word、视频和图片。飞书导出的「Markdown + 图片和附件」不要只传 .md，请先合成单个 HTML，交互图才能显示。'}</small></label><label className="checkbox-field"><input name="required" type="checkbox" defaultChecked={editing.required} /><span>标记为新人必读</span></label></form> : null}</AdminDialog>
  </>
}
