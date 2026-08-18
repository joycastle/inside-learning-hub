import { CheckCircle2 } from 'lucide-react'
import { AdminManagerSettings } from '@/components/admin-manager-settings'
import { AdminPageHeader } from '@/components/admin-page-header'
import { requireAdmin } from '@/lib/auth'
import { getOrganization } from '@/lib/api/server'

export const metadata = { title: '系统设置' }

export default async function SettingsPage() {
  const user = await requireAdmin()
  const organization = await getOrganization()
  const isSuperAdmin = user.role === 'superAdmin'

  return (
    <>
      <AdminPageHeader
        eyebrow="安全与集成"
        title="系统设置"
        description="查看飞书同步、默认分配和存储配置。敏感值只通过环境变量提供，不在页面显示。"
      />
      <div className="settings-grid">
        {isSuperAdmin ? <AdminManagerSettings initialOrganization={organization} currentUserId={user.id} /> : <section className="admin-panel settings-panel settings-panel--wide"><div className="settings-panel__heading"><div><h2>管理员配置</h2><p>仅超级管理员可以变更</p></div></div><p className="permission-note">当前账号没有修改管理员权限的能力。</p></section>}
        <section className="admin-panel settings-panel">
          <div className="settings-panel__heading"><div><h2>飞书组织同步</h2><p>登录并读取员工与部门信息</p></div><span className="integration-state"><CheckCircle2 size={15} aria-hidden="true" />配置就绪</span></div>
          <dl className="settings-list">
            <div><dt>OAuth 回调</dt><dd>/api/v1/auth/feishu/callback</dd></div>
            <div><dt>同步内容</dt><dd>员工资料与组织架构</dd></div>
            <div><dt>事件订阅</dt><dd>未启用</dd></div>
          </dl>
        </section>
        <section className="admin-panel settings-panel">
          <div className="settings-panel__heading"><div><h2>默认入职分配</h2><p>首次登录仅执行一次</p></div><span className="integration-state"><CheckCircle2 size={15} aria-hidden="true" />已启用</span></div>
          <dl className="settings-list">
            <div><dt>学习路径</dt><dd>新员工入职学习路径</dd></div>
            <div><dt>默认期限</dt><dd>7 天</dd></div>
            <div><dt>适用范围</dt><dd>所有在职新员工</dd></div>
          </dl>
        </section>
        <section className="admin-panel settings-panel">
          <div className="settings-panel__heading"><div><h2>媒体存储</h2><p>MinIO 私有桶与签名访问</p></div><span className="integration-state"><CheckCircle2 size={15} aria-hidden="true" />私有访问</span></div>
          <dl className="settings-list">
            <div><dt>存储桶</dt><dd>training-assets</dd></div>
            <div><dt>签名有效期</dt><dd>15 分钟</dd></div>
            <div><dt>视频转发</dt><dd>不经过 Next.js</dd></div>
          </dl>
        </section>
      </div>
    </>
  )
}
