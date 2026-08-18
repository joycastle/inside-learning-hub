import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DocumentPreview } from '@/components/document-preview'
import { OnboardingTrainingDocument } from '@/components/onboarding-training-document'
import { getOnboardingHandout } from '@/lib/api/server'

export const metadata: Metadata = {
  title: '新人培训手册｜乐堡家园',
  description: '新人入职说明视频配套 HTML 讲义。',
}

export default async function OnboardingHandoutPage({ searchParams }: { searchParams: Promise<{ courseId?: string; unitId?: string }> }) {
  const handout = await getOnboardingHandout()
  const query = await searchParams
  const backHref = query.courseId && query.unitId
    ? `/learn/${encodeURIComponent(query.courseId)}/${encodeURIComponent(query.unitId)}`
    : '/learn'
  return (
    <div className="page-container handout-page">
      <Link className="handout-page__back" href={backHref}>
        <ArrowLeft size={16} aria-hidden="true" />返回培训视频
      </Link>
      {handout.mediaUrl ? <DocumentPreview title={handout.title} type="html" url={handout.mediaUrl} /> : <OnboardingTrainingDocument />}
    </div>
  )
}
