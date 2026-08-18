import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getServiceArticles } from '@/lib/api/server'

export async function GET(request: Request) {
  await requireUser()
  const query = new URL(request.url).searchParams.get('q')?.trim().toLocaleLowerCase() ?? ''
  if (!query) return NextResponse.json({ courses: [], units: [], services: [] })

  const services = (await getServiceArticles()).filter((article) =>
    `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase().includes(query),
  )
  return NextResponse.json({ courses: [], units: [], services })
}
