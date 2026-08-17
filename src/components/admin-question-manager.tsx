'use client'

import { Eye, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminDialog } from '@/components/admin-dialog'
import { extractDocxText, importQuestionsFromText } from '@/lib/question-import'
import { useStoredState } from '@/lib/use-stored-state'
import type { LearningPath, QuestionType, QuizQuestion } from '@/lib/types'

type ManagedQuestion = QuizQuestion & { status: 'published' | 'draft' }

const typeLabel: Record<QuestionType, string> = {
  single: '单选',
  multiple: '多选',
  trueFalse: '判断',
}

const createEmptyQuestion = (courseId: string): ManagedQuestion => ({
  id: '',
  courseId,
  categoryId: 'team-collaboration',
  type: 'single',
  prompt: '',
  options: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: '' })),
  correctOptionIds: [],
  explanation: '',
  difficulty: 'medium',
  status: 'draft',
})

export interface AdminQuestionManagerProps {
  initialPath: LearningPath
  initialQuestions: QuizQuestion[]
}

const categoryLabel = (categoryId: string) => {
  if (categoryId.includes('company')) return '公司认知'
  if (categoryId.includes('collaboration')) return '职场协作'
  if (categoryId.includes('security')) return '信息安全'
  if (categoryId.includes('first-week')) return '第一周'
  if (categoryId.includes('basics')) return '行业基础'
  return '导入题目'
}

export function AdminQuestionManager({ initialPath, initialQuestions }: AdminQuestionManagerProps) {
  const [paths] = useStoredState<LearningPath[]>('admin-training-paths-v1', [initialPath])
  const courseOptions = useMemo(() => {
    const courses = paths.flatMap((path) => path.courses)
    const uniqueCourses = new Map(courses.map((course) => [course.id, course]))
    initialPath.courses.forEach((course) => uniqueCourses.set(course.id, course))
    return [...uniqueCourses.values()]
  }, [initialPath.courses, paths])
  const defaultCourseId = courseOptions[0]?.id ?? initialPath.courses[0]?.id ?? 'course-onboarding'
  const [questions, setQuestions] = useStoredState<ManagedQuestion[]>('admin-question-bank-v3', initialQuestions.map((question) => ({ ...question, courseId: question.courseId || defaultCourseId, status: 'published' })))
  const [selectedCourseId, setSelectedCourseId] = useState('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [viewQuestion, setViewQuestion] = useState<ManagedQuestion | null>(null)
  const [draft, setDraft] = useState<ManagedQuestion>(createEmptyQuestion(defaultCourseId))
  const [feedback, setFeedback] = useState('')
  const filteredQuestions = useMemo(
    () => selectedCourseId === 'all' ? questions : questions.filter((question) => question.courseId === selectedCourseId),
    [questions, selectedCourseId],
  )
  const courseName = (courseId: string) => courseOptions.find((course) => course.id === courseId)?.title ?? '未关联课程'

  const startCreate = () => {
    setDraft(createEmptyQuestion(selectedCourseId === 'all' ? defaultCourseId : selectedCourseId))
    setEditorOpen(true)
  }

  const startEdit = (question: ManagedQuestion) => {
    setDraft({ ...question, options: question.options.map((option) => ({ ...option })) })
    setEditorOpen(true)
  }

  const toggleCorrectOption = (optionId: string) => {
    setDraft((current) => ({
      ...current,
      correctOptionIds: current.type === 'single'
        ? [optionId]
        : current.correctOptionIds.includes(optionId)
          ? current.correctOptionIds.filter((id) => id !== optionId)
          : [...current.correctOptionIds, optionId],
    }))
  }

  const saveQuestion = () => {
    if (!draft.prompt.trim() || draft.options.some((option) => !option.label.trim()) || draft.correctOptionIds.length === 0) {
      setFeedback('请填写题目、全部选项并设置正确答案。')
      return
    }
    const nextQuestion = { ...draft, id: draft.id || `question-${crypto.randomUUID()}` }
    setQuestions((current) => draft.id ? current.map((question) => question.id === draft.id ? nextQuestion : question) : [...current, nextQuestion])
    setEditorOpen(false)
    setFeedback(draft.id ? '题目已更新。' : '题目已创建并保存为草稿。')
  }

  const deleteQuestion = (question: ManagedQuestion) => {
    if (!window.confirm(`确认删除题目“${question.prompt}”吗？历史答题快照不会受影响。`)) return
    setQuestions((current) => current.filter((item) => item.id !== question.id))
    setFeedback('题目已删除。')
  }

  const importFile = async (file: File) => {
    try {
      const text = file.name.toLowerCase().endsWith('.docx') ? await extractDocxText(await file.arrayBuffer()) : await file.text()
      const targetCourseId = selectedCourseId === 'all' ? defaultCourseId : selectedCourseId
      const imported = importQuestionsFromText(text).map((question) => ({ ...question, courseId: targetCourseId, status: 'draft' as const }))
      if (!imported.length) throw new Error('没有识别到有效题目，请检查模板格式')
      setQuestions((current) => [...current, ...imported])
      setImportOpen(false)
      setFeedback(`已导入 ${imported.length} 道题，状态为草稿。`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '文件导入失败')
    }
  }

  return (
    <>
      <div className="admin-page-actions admin-page-actions--standalone admin-question-toolbar">
        <label className="compact-select-label admin-question-course-filter"><span>培训课程</span><select className="form-control" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}><option value="all">全部课程题库</option>{courseOptions.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
        <div className="admin-page-actions">
          <button className="button button--secondary" type="button" onClick={() => setImportOpen(true)}><Upload size={16} aria-hidden="true" />批量导入</button>
          <button className="button button--primary" type="button" onClick={startCreate}><Plus size={16} aria-hidden="true" />新建题目</button>
        </div>
      </div>
      {feedback ? <p className="admin-feedback" role="status">{feedback}</p> : null}
      <div className="summary-line">
        <span><strong>{filteredQuestions.length}</strong> 道题</span><span><strong>{courseOptions.length}</strong> 个课程题库</span><span><strong>3</strong> 道/次</span><span><strong>80</strong> 分通过</span>
      </div>
      <section className="admin-panel admin-panel--flush" aria-label="题库列表">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>题目</th><th>所属课程</th><th>题型</th><th>分类</th><th>难度</th><th>选项</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td className="question-cell"><strong>{question.prompt}</strong><small>{question.explanation || '暂无解析'}</small></td>
                  <td><span className="course-relation-label">{courseName(question.courseId)}</span></td>
                  <td>{typeLabel[question.type]}</td>
                  <td>{categoryLabel(question.categoryId)}</td>
                  <td>{question.difficulty === 'easy' ? '简单' : question.difficulty === 'hard' ? '困难' : '中等'}</td>
                  <td className="tabular">{question.options.length}</td>
                  <td><span className={question.status === 'published' ? 'publish-state' : 'draft-state'}>{question.status === 'published' ? '已发布' : '草稿'}</span></td>
                  <td><div className="table-actions"><button className="table-icon-button" type="button" aria-label={`查看：${question.prompt}`} onClick={() => setViewQuestion(question)}><Eye size={15} aria-hidden="true" /></button><button className="table-icon-button" type="button" aria-label={`编辑：${question.prompt}`} onClick={() => startEdit(question)}><Pencil size={15} aria-hidden="true" /></button><button className="table-icon-button" type="button" aria-label={`删除：${question.prompt}`} onClick={() => deleteQuestion(question)}><Trash2 size={15} aria-hidden="true" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDialog
        open={editorOpen}
        title={draft.id ? '编辑选择题' : '新建选择题'}
        description="一期支持单选题和多选题编写。"
        size="large"
        density="compact"
        onClose={() => setEditorOpen(false)}
        footer={<><button className="button button--quiet" type="button" onClick={() => setEditorOpen(false)}>取消</button><button className="button button--primary" type="button" onClick={saveQuestion}>保存题目</button></>}
      >
        <div className="admin-form">
          <div className="admin-form__grid">
            <label><span>所属培训课程</span><select className="form-control" value={draft.courseId} onChange={(event) => setDraft((current) => ({ ...current, courseId: event.target.value }))}>{courseOptions.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
            <label><span>题型</span><select className="form-control" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as 'single' | 'multiple', correctOptionIds: [] }))}><option value="single">单选题</option><option value="multiple">多选题</option></select></label>
            <label><span>状态</span><select className="form-control" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ManagedQuestion['status'] }))}><option value="draft">草稿</option><option value="published">已发布</option></select></label>
          </div>
          <label><span>题目</span><textarea className="form-control" rows={3} value={draft.prompt} onChange={(event) => setDraft((current) => ({ ...current, prompt: event.target.value }))} placeholder="请输入题目内容" /></label>
          <fieldset className="question-option-editor">
            <legend>选项与正确答案</legend>
            {draft.options.map((option, index) => <label className="question-option-row" key={option.id}><input type={draft.type === 'single' ? 'radio' : 'checkbox'} name="correctOption" checked={draft.correctOptionIds.includes(option.id)} onChange={() => toggleCorrectOption(option.id)} /><span>{option.id.toUpperCase()}</span><input className="form-control" value={option.label} onChange={(event) => setDraft((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} placeholder={`选项 ${option.id.toUpperCase()}`} /></label>)}
          </fieldset>
          <label><span>答案解析</span><textarea className="form-control" rows={3} value={draft.explanation} onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))} placeholder="说明正确答案及原因" /></label>
        </div>
      </AdminDialog>

      <AdminDialog open={importOpen} title="批量导入题目" description={`支持 CSV 与 Word（.docx），导入后归入“${courseName(selectedCourseId === 'all' ? defaultCourseId : selectedCourseId)}”。`} onClose={() => setImportOpen(false)}>
        <div className="import-guide">
          <p><strong>CSV 表头：</strong>题目、题型、选项A、选项B、选项C、选项D、正确答案、解析</p>
          <p><strong>Word 格式：</strong>每题依次使用“题目：”“A.”至“D.”“答案：”“解析：”。</p>
          <label className="file-drop-field"><Upload size={20} aria-hidden="true" /><span>选择 CSV 或 .docx 文件</span><input type="file" accept=".csv,.docx,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importFile(file)
          }} /></label>
        </div>
      </AdminDialog>

      <AdminDialog open={Boolean(viewQuestion)} title="查看题目" onClose={() => setViewQuestion(null)}>
        {viewQuestion ? <div className="question-preview"><span className="publish-state">{courseName(viewQuestion.courseId)} · {typeLabel[viewQuestion.type]}</span><h3>{viewQuestion.prompt}</h3><ol>{viewQuestion.options.map((option) => <li data-correct={viewQuestion.correctOptionIds.includes(option.id)} key={option.id}>{option.id.toUpperCase()}. {option.label}</li>)}</ol><p><strong>解析：</strong>{viewQuestion.explanation || '暂无解析'}</p></div> : null}
      </AdminDialog>
    </>
  )
}
