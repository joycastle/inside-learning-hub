import { OnboardingVideoCard } from '@/components/onboarding-video-card'
import { getEnrollments } from '@/lib/api/server'

export const metadata = { title: '新人入职' }

export default async function LearnPage() {
  const [onboardingPath] = await getEnrollments()
  if (!onboardingPath) return <div className="page-container main-content"><section className="surface empty-state"><h1 className="page-heading">暂无培训</h1><p>当前账号还没有已分配的学习路径。</p></section></div>
  const onboardingCourse = onboardingPath.courses[0]
  const onboardingVideo = onboardingCourse?.units[0]
  if (!onboardingCourse || !onboardingVideo) return <div className="page-container main-content"><section className="surface empty-state"><h1 className="page-heading">培训内容准备中</h1><p>当前培训路径还没有配置学习单元，请联系管理员补充课程内容。</p></section></div>

  return (
    <div className="page-container main-content">
      <header className="learn-header learn-header--single-video">
        <div>
          <h1 className="page-heading">新人入职</h1>
          <p className="page-description">通过一段入职说明视频，快速了解公司和第一周需要完成的事项。</p>
        </div>
      </header>

      <div className="section-block section-block--video">
        <OnboardingVideoCard
          courseId={onboardingCourse.id}
          unitId={onboardingVideo.id}
          title={onboardingCourse.title}
          description={onboardingCourse.summary}
          progress={onboardingVideo.progress}
        />
      </div>
    </div>
  )
}
