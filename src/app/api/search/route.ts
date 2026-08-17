import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { onboardingPath, serviceArticles } from '@/lib/demo-data'
import { getLearningPathForUser, getServiceArticles } from '@/lib/payload-data'

export async function GET(request: Request) {
  const user = await requireUser()
  const query = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase() ?? ''
  if (!query) return NextResponse.json({ courses: [], units: [], services: [] })

  const path = process.env.DEMO_MODE === 'false' ? await getLearningPathForUser(user) : onboardingPath
  const servicesData = process.env.DEMO_MODE === 'false' ? await getServiceArticles() : serviceArticles
  const courses = (path?.courses ?? []).filter((course) =>
    `${course.title} ${course.summary} ${course.category}`.toLocaleLowerCase().includes(query),
  )
  const units = (path?.courses ?? []).flatMap((course) =>
    course.units
      .filter((unit) => `${unit.title} ${unit.description}`.toLocaleLowerCase().includes(query))
      .map((unit) => ({ ...unit, courseId: course.id })),
  )
  const services = servicesData.filter((article) =>
    `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase().includes(query),
  )
  return NextResponse.json({ courses, units, services })
}
