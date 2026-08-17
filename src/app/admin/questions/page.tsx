import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin-page-header'
import { requireAdmin } from '@/lib/auth'
import { getCmsCollection } from '@/lib/api/cms'

export const metadata = { title: '题库管理' }

export default async function QuestionManagementPage() {
  await requireAdmin()
  const questions = await getCmsCollection('questions')
  return (
    <>
      <AdminPageHeader eyebrow="测评内容" title="题库管理" description="查看和维护培训测评题目，数据统一保存到 Payload。" actions={<Link className="button button--primary" href="/cms/collections/questions">新建题目</Link>} />
      <section className="admin-panel admin-panel--flush"><div className="management-list">{questions.length ? questions.map((item) => <div className="management-row" key={item.id}><div className="management-row__body"><strong>{item.prompt ?? item.title ?? '未命名题目'}</strong><p>{item.summary ?? item.slug ?? '题目内容'}</p></div><Link className="table-action" href={`/cms/collections/questions/${item.id}`}>编辑</Link></div>) : <div className="empty-state empty-state--compact"><p>暂无题目，点击右上角新建。</p></div>}</div></section>
    </>
  )
}
