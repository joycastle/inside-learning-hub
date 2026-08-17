import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { payloadClient } from '@/lib/payload-data'

const optionSchema = z.object({ id: z.string().min(1), label: z.string().trim().min(1) })
const schema = z.object({ id: z.string().optional(), courseId: z.string().min(1), categoryId: z.string().min(1), type: z.enum(['single', 'multiple', 'trueFalse']), prompt: z.string().trim().min(1), options: z.array(optionSchema).min(2), correctOptionIds: z.array(z.string()).min(1), explanation: z.string().default(''), difficulty: z.enum(['easy', 'medium', 'hard']), status: z.enum(['draft', 'published']).default('draft') })

const toPayload = (input: z.infer<typeof schema>) => ({
  course: input.courseId,
  category: input.categoryId,
  type: input.type,
  prompt: input.prompt,
  options: input.options.map((option) => ({ optionId: option.id, label: option.label, correct: input.correctOptionIds.includes(option.id) })),
  explanation: input.explanation,
  difficulty: input.difficulty,
  active: true,
  status: input.status,
})

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = schema.omit({ id: true }).safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ message: '题目格式错误' }, { status: 400 })
  const created = await (await payloadClient()).create({ collection: 'questions', data: toPayload(parsed.data), overrideAccess: true })
  return NextResponse.json({ id: created.id }, { status: 201 })
}

export async function PATCH(request: Request) {
  await requireAdmin()
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ message: '题目格式错误' }, { status: 400 })
  await (await payloadClient()).update({ collection: 'questions', id: parsed.data.id, data: toPayload(parsed.data), overrideAccess: true })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  await requireAdmin()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ message: '缺少题目 ID' }, { status: 400 })
  await (await payloadClient()).delete({ collection: 'questions', id, overrideAccess: true })
  return NextResponse.json({ ok: true })
}
