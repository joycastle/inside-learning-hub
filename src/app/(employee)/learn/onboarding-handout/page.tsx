import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OnboardingTrainingDocument } from '@/components/onboarding-training-document'

export const metadata: Metadata = {
  title: '新人培训手册｜乐堡家园',
  description: '新人入职说明视频配套 HTML 讲义。',
}

export default function OnboardingHandoutPage() {
  return (
    <div className="page-container handout-page">
      <Link className="handout-page__back" href="/learn/course-onboarding/unit-onboarding-video">
        <ArrowLeft size={16} aria-hidden="true" />返回培训视频
      </Link>
      <OnboardingTrainingDocument />
    </div>
  )
}
