import { ArrowRight, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'

export const metadata = { title: '登录' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <main className="login-page">
      <section className="login-story">
        <BrandMark href="/login" inverse />
        <div className="login-story__body">
          <h1>从第一天起，知道下一步该做什么。</h1>
          <p>培训资料、学习进度和日常员工服务，集中在一个清晰的内部入口。</p>
          <div className="login-path-preview" aria-label="入职学习路径预览">
            <div><span>01</span><strong>认识我们与协作方式</strong></div>
            <div><span>02</span><strong>信息安全基础</strong></div>
            <div><span>03</span><strong>工作工具快速上手</strong></div>
            <div><span>04</span><strong>合规与职业行为</strong></div>
          </div>
        </div>
        <span className="login-access-note">仅限公司员工访问</span>
      </section>

      <section className="login-panel">
        <div className="login-box">
          <h2>登录乐堡家园</h2>
          <p>使用公司飞书账号继续。</p>
          <a className="button button--primary" href="/api/auth/feishu/start">
            使用飞书登录<ArrowRight size={17} aria-hidden="true" />
          </a>
          {error === 'feishu-not-configured' ? <p className="login-message" role="status">本地尚未配置飞书凭证，请使用下方演示账号。</p> : null}
          <div className="login-divider">本地演示</div>
          {process.env.DEMO_MODE !== 'false' ? <div className="demo-login-actions">
            <form action="/api/auth/demo-login" method="post">
              <input type="hidden" name="role" value="employee" />
              <button className="button button--secondary" type="submit">体验员工端</button>
            </form>
            <form action="/api/auth/demo-login" method="post">
              <input type="hidden" name="role" value="admin" />
              <button className="button button--secondary" type="submit">体验管理端</button>
            </form>
          </div> : null}
          {process.env.DEMO_MODE !== 'false' ? <p className="demo-note"><ShieldCheck size={14} aria-hidden="true" /> 演示模式使用示例数据；生产环境关闭后仅保留飞书登录。</p> : null}
        </div>
      </section>
    </main>
  )
}
