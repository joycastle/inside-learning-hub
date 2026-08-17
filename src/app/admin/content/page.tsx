import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin-page-header'
import { requireAdmin } from '@/lib/auth'
import { getAdminCollection } from '@/lib/api/admin-content'

export const metadata = { title: '公告管理' }

export default async function ContentManagementPage() {
  await requireAdmin()
  const announcements = await getAdminCollection('announcements')
  return (
    <>
      <AdminPageHeader eyebrow="内容运营" title="公告管理" description="管理员工首页与通知面板展示的真实公告。" actions={<Link className="button button--primary" href="/admin/content?new=announcement">新建公告</Link>} />
      <section className="admin-panel admin-panel--flush">
        <div className="management-list">
          {announcements.length ? announcements.map((item) => <div className="management-row" key={item.id}><div className="management-row__body"><strong>{item.title ?? '未命名公告'}</strong><p>{item.summary ?? '暂无摘要'}</p></div><span className="text-muted text-small">{item._status === 'published' ? '已发布' : '草稿'}</span><Link className="table-action" href={`/admin/content?edit=${item.id}`}>编辑</Link></div>) : <div className="empty-state empty-state--compact"><p>暂无公告，点击右上角新建第一条公告。</p></div>}
        </div>
      </section>
    </>
  )
}
