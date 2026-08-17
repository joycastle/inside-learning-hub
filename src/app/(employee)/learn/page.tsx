import { OnboardingVideoCard } from '@/components/onboarding-video-card'
import { onboardingPath } from '@/lib/demo-data'

export const metadata = { title: '新人入职' }

export default function LearnPage() {
  const onboardingCourse = onboardingPath.courses[0]
  const onboardingVideo = onboardingCourse.units[0]

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
