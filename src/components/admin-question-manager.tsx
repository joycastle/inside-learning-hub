'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'

type Option = { optionId: string; label: string; correct: boolean }
type Question = { id: string | number; category?: string | number | { id?: string | number }; type?: string; prompt?: string; options?: Option[]; explanation?: string; difficulty?: string; active?: boolean }
type Category = { id: string | number; name?: string }

const defaultOptions = (): Option[] => [1, 2, 3, 4].map((index) => ({ optionId: `option-${index}`, label: '', correct: false }))

const categoryId = (category: Question['category']) => typeof category === 'object' && category ? String(category.id ?? '') : String(category ?? '')

export function AdminQuestionManager({ initialQuestions, categories }: { initialQuestions: Question[]; categories: Category[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing, setEditing] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const openNew = () => setEditing({ id: '', category: categories[0]?.id ?? '', type: 'single', prompt: '', options: defaultOptions(), explanation: '', difficulty: 'easy', active: true })
  const openEdit = (question: Question) => setEditing({ ...question, options: question.options?.length ? question.options : defaultOptions() })

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
    const response = await fetch(editing.id ? `/api/v1/admin/content/questions/${editing.id}` : '/api/v1/admin/content/questions', {
      method: editing.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string }
      setFeedback(error.message ?? '保存失败，请稍后重试。')
      return
    }
    const saved = await response.json() as Question
    setQuestions((current) => editing.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current])
    setEditing(null)
    setFeedback('题目已保存。')
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone">
        <button className="button button--primary" type="button" onClick={openNew}><Plus size={16} aria-hidden="true" />新建题目</button>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <section className="admin-panel admin-panel--flush">
        <div className="management-list">
          {questions.length ? questions.map((item) => <div className="management-row management-row--simple" key={item.id}>
            <div className="management-row__body"><strong>{item.prompt ?? '未命名题目'}</strong><p>{item.type === 'multiple' ? '多选题' : item.type === 'trueFalse' ? '判断题' : '单选题'} · {item.difficulty === 'hard' ? '困难' : item.difficulty === 'medium' ? '中等' : '简单'}</p></div>
            <button className="table-action" type="button" onClick={() => openEdit(item)}>编辑</button>
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
          <label><span>题目分类</span><select className="form-control" name="category" value={categoryId(editing.category)} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name ?? `分类 ${category.id}`}</option>)}</select></label>
          <label><span>题目内容</span><textarea className="form-control" name="prompt" value={editing.prompt ?? ''} onChange={(event) => setEditing({ ...editing, prompt: event.target.value })} required /></label>
          <fieldset className="question-option-editor"><legend>选项（勾选正确答案）</legend>{(editing.options ?? defaultOptions()).map((option, index) => <label className="question-option-row" key={option.optionId}><input type="checkbox" checked={option.correct} onChange={(event) => setEditing({ ...editing, options: (editing.options ?? defaultOptions()).map((current, currentIndex) => currentIndex === index ? { ...current, correct: event.target.checked } : current) })} /><span>{String.fromCharCode(65 + index)}</span><input className="form-control" value={option.label} onChange={(event) => setEditing({ ...editing, options: (editing.options ?? defaultOptions()).map((current, currentIndex) => currentIndex === index ? { ...current, label: event.target.value } : current) })} placeholder={`选项 ${index + 1}`} required /></label>)}</fieldset>
          <label><span>答案解析</span><textarea className="form-control" name="explanation" value={editing.explanation ?? ''} onChange={(event) => setEditing({ ...editing, explanation: event.target.value })} required /></label>
        </form> : null}
      </AdminDialog>
    </>
  )
}
