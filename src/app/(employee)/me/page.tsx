import { requireUser } from '@/lib/auth'
import { onboardingPath } from '@/lib/demo-data'
import { getLearningPathForUser } from '@/lib/payload-data'
import { formatDate } from '@/lib/format'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import { UserAvatar } from '@/components/user-avatar'

export const metadata = { title: '我的' }

export default async function MePage() {
  const user = await requireUser()
  const path = process.env.DEMO_MODE === 'false' ? await getLearningPathForUser(user) : onboardingPath

  return (
    <div className="page-container main-content">
      <header><h1 className="page-heading">我的学习</h1><p className="page-description">查看个人信息、当前培训和测评记录。</p></header>
      <div className="profile-grid">
        <section className="surface profile-panel">
          <UserAvatar user={user} size="large" />
          <h2 className="section-heading profile-name">{user.name}</h2>
          <p className="section-description">{user.englishName}</p>
          <dl className="profile-details">
            <div><dt>部门</dt><dd>{user.departmentName}</dd></div>
            <div><dt>入职日期</dt><dd>{formatDate(user.joinedAt)}</dd></div>
            <div><dt>邮箱</dt><dd>{user.email}</dd></div>
            <div><dt>账号来源</dt><dd>飞书企业账号</dd></div>
          </dl>
        </section>
        <section>
          <h2 className="section-heading">当前培训</h2>
          <div className="record-list">
            <div className="record-row">
              <span><strong>{path?.title ?? '暂无培训路径'}</strong><div className="text-small text-muted">{path ? `截止 ${formatDate(path.dueAt)}` : '等待管理员分配'}</div></span>
              <span><ProgressBar value={path?.progress ?? 0} label="入职路径进度" /></span>
              <strong className="tabular">{path?.progress ?? 0}%</strong>
            </div>
          </div>
          <h2 className="section-heading profile-section-heading">最近测评</h2>
          <div className="record-list">
            <div className="record-row">
              <span><strong>欢迎加入：单元测评</strong><div className="text-small text-muted">8 月 12 日 · 第 2 次尝试</div></span>
              <strong className="tabular">86 分</strong>
              <StatusBadge status="completed" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
