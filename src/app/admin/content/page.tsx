import { Megaphone, Plus } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin-page-header'

export const metadata = { title: '内容与公告' }

const announcements = [
  { title: '2026 年差旅与费用报销规范已更新', audience: '全员', publishedAt: '2026-08-12', status: '已发布' },
  { title: '新员工入职第一周安排', audience: '近 30 天入职员工', publishedAt: '2026-08-08', status: '已发布' },
  { title: '年度信息安全复训提醒', audience: '全员', publishedAt: '—', status: '草稿' },
]

export default function ContentManagementPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="内容运营"
        title="内容与公告"
        description="发布员工首页必读通知，控制展示人群与有效期。"
        actions={<button className="button button--primary" type="button"><Plus size={16} aria-hidden="true" />新建公告</button>}
      />
      <section className="admin-panel admin-panel--flush" aria-label="公告列表">
        <div className="announcement-list">
          {announcements.map((announcement, index) => (
            <div className="announcement-row" key={announcement.title}>
              <span className="announcement-row__icon"><Megaphone size={18} aria-hidden="true" /></span>
              <div><strong>{announcement.title}</strong><p>展示人群：{announcement.audience} · 发布时间：{announcement.publishedAt}</p></div>
              <span className={announcement.status === '草稿' ? 'draft-state' : 'publish-state'}>{announcement.status}</span>
              <button className="table-button" type="button" aria-label={`编辑${announcement.title}`}>编辑</button>
              <span className="tabular text-muted text-small">{String(index + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
