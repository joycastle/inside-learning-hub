import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { onboardingPath, serviceArticles } from '@/lib/demo-data'

export async function GET(request: Request) {
  await requireUser()
  const query = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase() ?? ''
  if (!query) return NextResponse.json({ courses: [], units: [], services: [] })

  const courses = onboardingPath.courses.filter((course) =>
    `${course.title} ${course.summary} ${course.category}`.toLocaleLowerCase().includes(query),
  )
  const units = onboardingPath.courses.flatMap((course) =>
    course.units
      .filter((unit) => `${unit.title} ${unit.description}`.toLocaleLowerCase().includes(query))
      .map((unit) => ({ ...unit, courseId: course.id })),
  )
  const services = serviceArticles.filter((article) =>
    `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase().includes(query),
  )
  return NextResponse.json({ courses, units, services })
}
