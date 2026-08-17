'use client'

import { ArrowUpRight, FileText, LayoutTemplate, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { formatDate } from '@/lib/format'
import type { ServiceArticle } from '@/lib/types'

type ManagedServiceArticle = ServiceArticle & {
  creationMode: 'page' | 'upload'
  fileName?: string
  status: 'published' | 'draft'
}

export interface AdminServiceManagerProps {
  initialArticles: ServiceArticle[]
}

export function AdminServiceManager({ initialArticles }: AdminServiceManagerProps) {
  const [articles, setArticles] = useState<ManagedServiceArticle[]>(initialArticles.map((article) => ({ ...article, creationMode: 'page', status: 'published' })))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<ManagedServiceArticle | null>(null)
  const [creationMode, setCreationMode] = useState<'page' | 'upload'>('page')
  const [feedback, setFeedback] = useState('')

  const createContent = async (formData: FormData) => {
    const title = String(formData.get('title') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    const category = String(formData.get('category') ?? 'HR') as ServiceArticle['category']
    const tags = String(formData.get('tags') ?? '').split(/[，,]/).map((tag) => tag.trim()).filter(Boolean)
    const status = String(formData.get('status') ?? 'draft') as ManagedServiceArticle['status']
    const content = String(formData.get('content') ?? '').trim()
    const file = formData.get('document')
    const uploadedFile = file instanceof File && file.size > 0 ? file : null

    if (!title || !summary) {
      setFeedback('请填写标题和摘要。')
      return
    }
    if (creationMode === 'page' && !content) {
      setFeedback('页面新建需要填写正文内容。')
      return
    }
    if (creationMode === 'upload' && !uploadedFile) {
      setFeedback('请选择 PDF、DOC 或 DOCX 文档。')
      return
    }

    const isPdf = uploadedFile?.name.toLowerCase().endsWith('.pdf')
    const nextArticle: ManagedServiceArticle = {
      id: editingArticle?.id ?? `service-${crypto.randomUUID()}`,
      category,
      title,
      summary,
      type: creationMode === 'upload' && isPdf ? 'pdf' : 'article',
      updatedAt: new Date().toISOString(),
      tags,
      source: creationMode === 'upload' ? '上传文档' : '页面新建',
      sections: creationMode === 'page' ? [{ title: '正文', paragraphs: content.split(/\n+/).filter(Boolean) }] : undefined,
      creationMode,
      fileName: uploadedFile?.name,
      status,
    }
    let mediaId: string | undefined
    if (uploadedFile) {
      const uploadForm = new FormData()
      uploadForm.set('title', title)
      uploadForm.set('file', uploadedFile)
      const uploadResponse = await fetch('/api/admin/media', { method: 'POST', body: uploadForm })
      if (!uploadResponse.ok) { setFeedback('文件上传失败，请检查文件格式或存储服务。'); return }
      mediaId = String((await uploadResponse.json() as { id: string | number }).id)
    }
    const response = await fetch('/api/admin/services', { method: editingArticle ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingArticle?.id, title, summary, category, tags, status, type: nextArticle.type, bodyText: content, source: nextArticle.source, fileName: nextArticle.fileName, mediaId }) })
    if (!response.ok) { setFeedback('员工服务内容保存失败，请稍后重试。'); return }
    setArticles((current) => editingArticle ? current.map((article) => article.id === editingArticle.id ? nextArticle : article) : [nextArticle, ...current])
    setDialogOpen(false)
    setEditingArticle(null)
    setFeedback(`已${editingArticle ? '更新' : status === 'published' ? '发布' : '保存'}“${title}”。`)
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone">
        <button className="button button--primary" type="button" onClick={() => setDialogOpen(true)}><Plus size={16} aria-hidden="true" />新建内容</button>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <div className="category-summary">
        {(['HR', '行政', 'IT'] as const).map((category) => (
          <div key={category}><span>{category}</span><strong className="tabular">{articles.filter((article) => article.category === category && article.status === 'published').length}</strong><small>篇已发布</small></div>
        ))}
      </div>
      <section className="admin-panel admin-panel--flush" aria-label="员工服务内容列表">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>标题</th><th>分类</th><th>内容类型</th><th>标签</th><th>最近更新</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td><strong>{article.title}</strong><small>{article.summary}</small></td>
                  <td>{article.category}</td>
                  <td>{article.creationMode === 'upload' ? `上传文档${article.fileName ? ` · ${article.fileName}` : ''}` : article.type === 'feishuDoc' ? '飞书文档' : article.type === 'externalLink' ? '办事链接' : '页面内容'}</td>
                  <td>{article.tags.slice(0, 2).join('、') || '—'}</td>
                  <td className="tabular">{formatDate(article.updatedAt)}</td>
                  <td><span className={article.status === 'published' ? 'publish-state' : 'draft-state'}>{article.status === 'published' ? '已发布' : '草稿'}</span></td>
                  <td><button className="table-button" type="button" aria-label={`编辑${article.title}`} onClick={() => { setEditingArticle(article); setCreationMode(article.type === 'pdf' ? 'upload' : 'page'); setDialogOpen(true) }}><ArrowUpRight size={15} aria-hidden="true" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDialog open={dialogOpen} title={editingArticle ? '编辑员工服务内容' : '新建员工服务内容'} description="选择上传制度文档，或直接创建可搜索的页面内容。" size="large" onClose={() => { setDialogOpen(false); setEditingArticle(null) }}>
        <div className="content-mode-switch" role="tablist" aria-label="内容创建方式">
          <button type="button" role="tab" aria-selected={creationMode === 'page'} onClick={() => setCreationMode('page')}><LayoutTemplate size={17} aria-hidden="true" /><span><strong>页面新建</strong><small>编辑站内页面正文</small></span></button>
          <button type="button" role="tab" aria-selected={creationMode === 'upload'} onClick={() => setCreationMode('upload')}><Upload size={17} aria-hidden="true" /><span><strong>上传文档</strong><small>支持 PDF、DOC、DOCX</small></span></button>
        </div>
        <form className="admin-form" action={createContent}>
          <div className="admin-form__grid">
            <label><span>分类</span><select className="form-control" name="category" defaultValue={editingArticle?.category ?? 'HR'}><option value="HR">HR</option><option value="行政">行政</option><option value="IT">IT</option></select></label>
            <label><span>状态</span><select className="form-control" name="status" defaultValue={editingArticle?.status ?? 'draft'}><option value="draft">保存草稿</option><option value="published">立即发布</option></select></label>
          </div>
          <label><span>标题</span><input className="form-control" name="title" defaultValue={editingArticle?.title ?? ''} placeholder="例如：补充医疗保险申请指引" /></label>
          <label><span>摘要</span><textarea className="form-control" name="summary" defaultValue={editingArticle?.summary ?? ''} rows={2} placeholder="一句话说明内容适用范围" /></label>
          <label><span>标签</span><input className="form-control" name="tags" defaultValue={editingArticle?.tags.join('、') ?? ''} placeholder="使用逗号分隔，例如：保险，报销" /></label>
          {creationMode === 'page' ? <label><span>页面正文</span><textarea className="form-control" name="content" defaultValue={editingArticle?.sections?.flatMap((section) => section.paragraphs ?? []).join('\n') ?? ''} rows={7} placeholder="输入制度说明、办理步骤和注意事项" /></label> : <label className="document-upload-field"><FileText size={22} aria-hidden="true" /><span><strong>选择制度文档</strong><small>文件会在正式环境上传至私有存储；当前原型保存文件名称与内容记录。</small></span><input name="document" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></label>}
          <div className="admin-dialog__footer admin-dialog__footer--inline"><button className="button button--quiet" type="button" onClick={() => setDialogOpen(false)}>取消</button><button className="button button--primary" type="submit">保存内容</button></div>
        </form>
      </AdminDialog>
    </>
  )
}
