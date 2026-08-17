import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin-page-header'
import { requireAdmin } from '@/lib/auth'
import { getCmsCollection } from '@/lib/api/cms'

export const metadata = { title: '员工服务管理' }

export default async function ServicesManagementPage() {
  await requireAdmin()
  const articles = await getCmsCollection('knowledge-articles')
  return (
    <>
      <AdminPageHeader eyebrow="员工服务" title="服务内容管理" description="维护 HR、行政和 IT 服务文章及其配套资源。" actions={<Link className="button button--primary" href="/cms/collections/knowledge-articles">新建服务内容</Link>} />
      <section className="admin-panel admin-panel--flush"><div className="management-list">{articles.length ? articles.map((item) => <div className="management-row" key={item.id}><div className="management-row__body"><strong>{item.title ?? '未命名内容'}</strong><p>{item.summary ?? item.slug ?? '暂无摘要'}</p></div><span className="text-muted text-small">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : '—'}</span><Link className="table-action" href={`/cms/collections/knowledge-articles/${item.id}`}>编辑</Link></div>) : <div className="empty-state empty-state--compact"><p>暂无服务内容，点击右上角新建。</p></div>}</div></section>
    </>
  )
}
