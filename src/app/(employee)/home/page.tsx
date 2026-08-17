import Link from 'next/link'
import { OnboardingVideoCard } from '@/components/onboarding-video-card'
import { WelcomeEnvelope } from '@/components/welcome-envelope'
import { requireUser } from '@/lib/auth'
import { onboardingPath, serviceArticles } from '@/lib/demo-data'

export const metadata = { title: '首页' }

export default async function HomePage() {
  const user = await requireUser()
  const onboardingCourse = onboardingPath.courses[0]
  const onboardingVideo = onboardingCourse.units[0]

  return (
    <>
      <WelcomeEnvelope userId={user.id} />
      <div className="page-container main-content">
        <div className="notice-strip">
          <div className="notice-strip__copy">
            <span className="notice-strip__dot" aria-hidden="true" />
            <span><strong>本周必读 ·</strong> 2026 年差旅与费用报销规范已更新</span>
          </div>
          <div className="notice-strip__actions">
            <Link href="/services">查看说明 →</Link>
          </div>
        </div>

        <header className="home-welcome">
          <div>
            <h1 className="page-heading">早上好，{user.name}</h1>
            <p className="page-description">入职介绍视频还没看完，从上次位置继续即可。</p>
          </div>
          <span className="home-welcome__date">FRI · 8 / 14</span>
        </header>

        <OnboardingVideoCard
          courseId={onboardingCourse.id}
          unitId={onboardingVideo.id}
          title={onboardingCourse.title}
          description={onboardingCourse.summary}
          progress={onboardingVideo.progress}
        />

        <section className="home-services">
          <header className="section-header section-header--split">
            <h2 className="section-heading">常用员工服务</h2>
          </header>
          <div className="service-quick-list">
            {serviceArticles.slice(0, 3).map((article) => (
              <Link className="service-quick-link interactive-row" href={article.url ?? `/services/${article.id}`} key={article.id} target={article.url ? '_blank' : undefined} rel={article.url ? 'noreferrer' : undefined}>
                <span className="service-quick-link__category">{article.category}</span>
                <span><strong>{article.title}</strong><small>{article.summary}</small></span>
                <span className="row-arrow" aria-hidden="true">{article.url ? '↗' : '→'}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
