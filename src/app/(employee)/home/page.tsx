import Link from 'next/link'
import { OnboardingVideoCard } from '@/components/onboarding-video-card'
import { WelcomeEnvelope } from '@/components/welcome-envelope'
import { requireUser } from '@/lib/auth'
import { onboardingPath, serviceArticles } from '@/lib/demo-data'
import { getAnnouncementsForUser, getLearningPathForUser, getServiceArticles } from '@/lib/payload-data'
import { formatHomeDate } from '@/lib/format'

export const metadata = { title: '首页' }

export default async function HomePage() {
  const user = await requireUser()
  const path = process.env.DEMO_MODE === 'false' ? await getLearningPathForUser(user) : onboardingPath
  const services = process.env.DEMO_MODE === 'false' ? await getServiceArticles() : serviceArticles
  const announcements = process.env.DEMO_MODE === 'false' ? await getAnnouncementsForUser(user) : []
  const onboardingCourse = path?.courses[0]
  const onboardingVideo = onboardingCourse?.units[0]

  return (
    <>
      <WelcomeEnvelope userId={user.id} />
      <div className="page-container main-content">
        {announcements[0] ? <div className="notice-strip">
          <div className="notice-strip__copy">
            <span className="notice-strip__dot" aria-hidden="true" />
            <span><strong>本周必读 ·</strong> {announcements[0].title}</span>
          </div>
          <div className="notice-strip__actions">
            <Link href={announcements[0].targetUrl ?? '/services'} target={announcements[0].targetUrl?.startsWith('http') ? '_blank' : undefined} rel={announcements[0].targetUrl?.startsWith('http') ? 'noreferrer' : undefined}>查看说明 →</Link>
          </div>
        </div> : null}

        <header className="home-welcome">
          <div>
            <h1 className="page-heading">早上好，{user.name}</h1>
            <p className="page-description">{onboardingVideo?.progress ? '从上次位置继续学习即可。' : '从新人入职说明开始，完成你的第一项培训。'}</p>
          </div>
          <span className="home-welcome__date">{formatHomeDate()}</span>
        </header>

        {onboardingCourse && onboardingVideo ? <OnboardingVideoCard
          courseId={onboardingCourse.id}
          unitId={onboardingVideo.id}
          title={onboardingCourse.title}
          description={onboardingCourse.summary}
          progress={onboardingVideo.progress}
        /> : <section className="empty-state" aria-label="暂无培训任务"><h2>暂未分配培训路径</h2><p>请联系管理员为你分配入职培训。</p></section>}

        <section className="home-services">
          <header className="section-header section-header--split">
            <h2 className="section-heading">常用员工服务</h2>
          </header>
          <div className="service-quick-list">
            {services.slice(0, 3).map((article) => (
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
