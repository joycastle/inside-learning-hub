import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getEnrollments, getServiceArticles } from '@/lib/api/server'

export async function GET(request: Request) {
  await requireUser()
  const query = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase() ?? ''
  if (!query) return NextResponse.json({ courses: [], units: [], services: [] })

  const [paths, serviceArticles] = await Promise.all([getEnrollments(), getServiceArticles()])
  const services = serviceArticles.filter((article) =>
    `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase().includes(query),
  )
  const courses = paths.flatMap((path) => path.courses).filter((course) => `${course.title} ${course.summary}`.toLocaleLowerCase().includes(query)).map((course) => ({ id: course.id, title: course.title, summary: course.summary }))
  const units = paths.flatMap((path) => path.courses.flatMap((course) => course.units)).filter((unit) => `${unit.title} ${unit.description}`.toLocaleLowerCase().includes(query)).map((unit) => ({ id: unit.id, courseId: unit.courseId, title: unit.title, description: unit.description }))
  return NextResponse.json({ courses, units, services })
}
