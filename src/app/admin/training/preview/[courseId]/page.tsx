import { notFound } from 'next/navigation'
import { AdminCoursePreview } from '@/components/admin-course-preview'
import { getAdminTrainingPaths } from '@/lib/api/server'

export const metadata = { title: '培训内容预览' }

export default async function AdminTrainingPreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const paths = await getAdminTrainingPaths()
  const course = paths.flatMap((path) => path.courses).find((item) => item.id === courseId)
  if (!course) notFound()
  return <AdminCoursePreview course={course} />
}
