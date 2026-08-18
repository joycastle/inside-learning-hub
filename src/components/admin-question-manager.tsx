'use client'

import { FileUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { SearchableSelect } from '@/components/searchable-select'

type Option = { optionId: string; label: string; correct: boolean }
type Question = { id: string | number; category?: string | number | { id?: string | number }; type?: string; prompt?: string; options?: Option[]; explanation?: string; difficulty?: string; active?: boolean }
type Category = { id: string | number; name?: string }

const defaultOptions = (): Option[] => [1, 2, 3, 4].map((index) => ({ optionId: `option-${index}`, label: '', correct: false }))

const categoryId = (category: Question['category']) => typeof category === 'object' && category ? String(category.id ?? '') : String(category ?? '')

export function AdminQuestionManager({ initialQuestions, categories }: { initialQuestions: Question[]; categories: Category[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [categoryItems, setCategoryItems] = useState(categories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editing, setEditing] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  const openNew = () => setEditing({ id: '', category: categoryItems[0]?.id ?? '', type: 'single', prompt: '', options: defaultOptions(), explanation: '', difficulty: 'easy', active: true })
  const openEdit = (question: Question) => setEditing({ ...question, options: question.options?.length ? question.options : defaultOptions() })

  const saveCategory = async (formData: FormData) => {
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return
    const id = editingCategory?.id
    const response = await fetch(id ? `/api/v1/admin/content/question-categories/${id}` : '/api/v1/admin/content/question-categories', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify({ name }),
    })
    const result = await response.json().catch(() => ({})) as Category & { message?: string }
    if (!response.ok) { setFeedback(result.message ?? '分类保存失败，请稍后重试。'); return }
    setCategoryItems((current) => id ? current.map((item) => item.id === result.id ? result : item) : [result, ...current])
    setEditingCategory(null)
    setFeedback(id ? '题目分类已修改。' : '题目分类已新增。')
  }

  const save = async (formData: FormData) => {
    if (!editing || saving) return
    setSaving(true)
    setFeedback('')
    const options = (editing.options ?? defaultOptions()).map((option, index) => ({ ...option, optionId: `option-${index + 1}` }))
    const payload = {
      category: String(formData.get('category') ?? ''),
      type: String(formData.get('type') ?? 'single'),
      prompt: String(formData.get('prompt') ?? ''),
      options,
      explanation: String(formData.get('explanation') ?? ''),
      difficulty: String(formData.get('difficulty') ?? 'easy'),
      active: true,
    }
    try {
      const response = await fetch(editing.id ? `/api/v1/admin/content/questions/${editing.id}` : '/api/v1/admin/content/questions', {
        method: editing.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        setFeedback(error.message ?? '保存失败，请稍后重试。')
        return
      }
      const saved = await response.json() as Question
      setQuestions((current) => editing.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
      setEditing(null)
      setFeedback('题目已保存。')
    } catch {
      setFeedback('网络异常，保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (question: Question) => {
    if (!question.id || !window.confirm('确定删除这道题目吗？')) return
    try {
      const response = await fetch(`/api/v1/admin/content/questions/${question.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } })
      if (!response.ok) { setFeedback('删除失败，请稍后重试。'); return }
      setQuestions((current) => current.filter((item) => item.id !== question.id))
      setFeedback('题目已删除。')
    } catch {
      setFeedback('网络异常，删除失败，请稍后重试。')
    }
  }

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImporting(true)
    const form = new FormData()
    form.set('file', file)
    try {
      const response = await fetch('/api/v1/admin/content/questions/import', { method: 'POST', headers: { Origin: window.location.origin }, body: form })
      const result = await response.json().catch(() => ({})) as { items?: Question[]; message?: string }
      if (!response.ok) { setFeedback(result.message ?? '导入失败，请检查 CSV 格式。'); return }
      setQuestions((current) => [...(result.items ?? []), ...current])
      setFeedback(`已导入 ${result.items?.length ?? 0} 道题目。`)
    } catch {
      setFeedback('网络异常，导入失败，请稍后重试。')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone">
        <button className="button button--primary" type="button" onClick={openNew}><Plus size={16} aria-hidden="true" />新建题目</button>
        <label className="button button--quiet"><FileUp size={16} aria-hidden="true" />{importing ? '导入中…' : '导入 CSV'}<input type="file" accept=".csv,text/csv" hidden disabled={importing} onChange={importCsv} /></label>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <section className="admin-panel admin-panel--flush question-categories-panel" aria-labelledby="question-categories-heading">
        <div className="panel-heading panel-heading--padded"><div><h2 id="question-categories-heading">题目分类</h2><p>分类可新增和修改；正在被题目使用的分类不能直接删除。</p></div><button className="button button--secondary" type="button" onClick={() => setEditingCategory({ id: '', name: '' })}><Plus size={16} aria-hidden="true" />新增分类</button></div>
        <div className="management-list">{categoryItems.length ? categoryItems.map((category) => <div className="management-row management-row--simple" key={category.id}><div className="management-row__body"><strong>{category.name ?? `分类 ${category.id}`}</strong></div><div className="management-row__actions"><button className="table-action" type="button" onClick={() => setEditingCategory(category)}><Pencil size={14} aria-hidden="true" />编辑</button><button className="table-action table-action--danger" type="button" onClick={async () => { if (!window.confirm(`确定删除分类“${category.name ?? ''}”吗？`)) return; const response = await fetch(`/api/v1/admin/content/question-categories/${category.id}`, { method: 'DELETE', headers: { Origin: window.location.origin } }); const result = await response.json().catch(() => ({})) as { message?: string }; if (!response.ok) { setFeedback(result.message ?? '分类删除失败，请先调整题目分类。'); return }; setCategoryItems((current) => current.filter((item) => item.id !== category.id)); setFeedback('题目分类已删除。') }}><Trash2 size={14} aria-hidden="true" />删除</button></div></div>) : <div className="empty-state empty-state--compact"><p>暂无题目分类，请先新增。</p></div>}</div>
      </section>
      <section className="admin-panel admin-panel--flush">
        <div className="management-list">
          {questions.length ? questions.map((item) => <div className="management-row management-row--simple" key={item.id}>
            <div className="management-row__body"><strong>{item.prompt ?? '未命名题目'}</strong><p>{item.type === 'multiple' ? '多选题' : item.type === 'trueFalse' ? '判断题' : '单选题'} · {item.difficulty === 'hard' ? '困难' : item.difficulty === 'medium' ? '中等' : '简单'}</p></div>
            <div className="management-row__actions"><button className="table-action" type="button" onClick={() => openEdit(item)}>编辑</button><button className="table-action table-action--danger" type="button" onClick={() => remove(item)}><Trash2 size={14} aria-hidden="true" />删除</button></div>
          </div>) : <div className="empty-state empty-state--compact"><p>暂无题目，点击右上角新建。</p></div>}
        </div>
      </section>

      <AdminDialog open={Boolean(editing)} title={editing?.id ? '编辑题目' : '新建题目'} description="保存后会立即用于后续培训测评。" size="large" density="compact" onClose={() => !saving && setEditing(null)} footer={
        <><button className="button button--quiet" type="button" onClick={() => setEditing(null)} disabled={saving}>取消</button><button className="button button--primary" type="submit" form="question-editor-form" disabled={saving}>{saving ? '保存中…' : '保存题目'}</button></>
      }>
        {editing ? <form className="admin-form" id="question-editor-form" action={save}>
          <div className="admin-form__grid">
            <label><span>题目类型</span><select className="form-control" name="type" value={editing.type ?? 'single'} onChange={(event) => setEditing({ ...editing, type: event.target.value })}><option value="single">单选题</option><option value="multiple">多选题</option><option value="trueFalse">判断题</option></select></label>
            <label><span>难度</span><select className="form-control" name="difficulty" value={editing.difficulty ?? 'easy'} onChange={(event) => setEditing({ ...editing, difficulty: event.target.value })}><option value="easy">简单</option><option value="medium">中等</option><option value="hard">困难</option></select></label>
          </div>
          <label><span>题目分类</span><SearchableSelect name="category" required value={categoryId(editing.category)} onChange={(value) => setEditing({ ...editing, category: value })} placeholder="请选择题目分类" searchPlaceholder="搜索分类" options={categoryItems.map((category) => ({ value: String(category.id), label: category.name ?? `分类 ${category.id}` }))} /></label>
          <label><span>题目内容</span><textarea className="form-control" name="prompt" value={editing.prompt ?? ''} onChange={(event) => setEditing({ ...editing, prompt: event.target.value })} required /></label>
          <fieldset className="question-option-editor"><legend>选项（勾选正确答案）</legend>{(editing.options ?? defaultOptions()).map((option, index) => <label className="question-option-row" key={option.optionId}><input type="checkbox" checked={option.correct} onChange={(event) => setEditing({ ...editing, options: (editing.options ?? defaultOptions()).map((current, currentIndex) => currentIndex === index ? { ...current, correct: event.target.checked } : current) })} /><span>{String.fromCharCode(65 + index)}</span><input className="form-control" value={option.label} onChange={(event) => setEditing({ ...editing, options: (editing.options ?? defaultOptions()).map((current, currentIndex) => currentIndex === index ? { ...current, label: event.target.value } : current) })} placeholder={`选项 ${index + 1}`} required /></label>)}</fieldset>
          <label><span>答案解析</span><textarea className="form-control" name="explanation" value={editing.explanation ?? ''} onChange={(event) => setEditing({ ...editing, explanation: event.target.value })} required /></label>
        </form> : null}
      </AdminDialog>
      <AdminDialog open={Boolean(editingCategory)} title={editingCategory?.id ? '编辑题目分类' : '新增题目分类'} description="分类名称会立即用于题库筛选和题目编辑。" size="medium" onClose={() => setEditingCategory(null)} footer={<><button className="button button--quiet" type="button" onClick={() => setEditingCategory(null)}>取消</button><button className="button button--primary" type="submit" form="category-editor-form">保存分类</button></>}>
        {editingCategory ? <form className="admin-form" id="category-editor-form" action={saveCategory}><label><span>分类名称</span><input className="form-control" name="name" defaultValue={editingCategory.name ?? ''} required autoFocus /></label></form> : null}
      </AdminDialog>
    </>
  )
}
