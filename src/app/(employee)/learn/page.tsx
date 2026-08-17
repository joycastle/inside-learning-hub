import { OnboardingVideoCard } from '@/components/onboarding-video-card'
import { requireUser } from '@/lib/auth'
import { onboardingPath } from '@/lib/demo-data'
import { getLearningPathForUser } from '@/lib/payload-data'

export const metadata = { title: '新人入职' }

export default async function LearnPage() {
  const user = await requireUser()
  const path = process.env.DEMO_MODE === 'false' ? await getLearningPathForUser(user) : onboardingPath
  const onboardingCourse = path?.courses[0]
  if (!onboardingCourse) return null
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
