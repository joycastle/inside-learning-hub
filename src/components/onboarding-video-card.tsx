import { Play } from 'lucide-react'
import Link from 'next/link'
import { ProgressBar } from '@/components/progress-bar'

export interface OnboardingVideoCardProps {
  courseId: string
  unitId: string
  title: string
  description: string
  progress: number
}

export function OnboardingVideoCard({
  courseId,
  unitId,
  title,
  description,
  progress,
}: OnboardingVideoCardProps) {
  const href = `/learn/${courseId}/${unitId}`
  const actionLabel = progress > 0 ? '继续观看' : '开始观看'

  return (
    <section className="onboarding-video-card" aria-labelledby="onboarding-video-title">
      <Link className="onboarding-video-card__media" href={href} aria-label={`${actionLabel}：${title}`}>
        <span className="onboarding-video-card__play" aria-hidden="true"><Play size={24} fill="currentColor" /></span>
        <span>新人入职说明视频</span>
      </Link>
      <div className="onboarding-video-card__body">
        <div>
          <h2 id="onboarding-video-title">{title}</h2>
          <p>{description}</p>
        </div>
        <div>
          <div className="onboarding-video-card__progress-row">
            <span>观看进度</span>
            <strong>{progress}%</strong>
          </div>
          <ProgressBar value={progress} label={`${title}观看进度`} />
          <Link className="button button--primary" href={href}>{actionLabel}<span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  )
}
