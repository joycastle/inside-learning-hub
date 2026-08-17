import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const schema = z.object({ title: z.string().trim().min(1), summary: z.string().trim().min(1), category: z.enum(['HR', '行政', 'IT']), tags: z.array(z.string()), status: z.enum(['draft', 'published']), type: z.enum(['article', 'pdf', 'feishuDoc', 'externalLink']), bodyText: z.string().default(''), source: z.string().optional(), fileName: z.string().optional() })
const slug = (value: string) => `${value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 8)}`

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '员工服务内容格式错误' }, { status: 400 })
  const payload = await payloadClient()
  const categoryResult = await payload.find({ collection: 'service-categories', where: { slug: { equals: parsed.data.category } }, limit: 1, overrideAccess: true })
  const category = categoryResult.docs[0] ?? await payload.create({ collection: 'service-categories', data: { name: parsed.data.category, slug: parsed.data.category, order: 0 }, overrideAccess: true })
  const article = await payload.create({ collection: 'knowledge-articles', data: { title: parsed.data.title, slug: slug(parsed.data.title), summary: parsed.data.summary, type: parsed.data.type, bodyText: parsed.data.bodyText, source: parsed.data.source ?? parsed.data.fileName, category: category.id, tags: parsed.data.tags.map((label) => ({ label })), status: parsed.data.status }, overrideAccess: true })
  return NextResponse.json({ id: article.id }, { status: 201 })
}
