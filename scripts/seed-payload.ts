import config from '@payload-config'
import { getPayload } from 'payload'
import { onboardingPath, questionBank, serviceArticles } from '@/lib/demo-data'

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')

const findBySlug = async (payload: any, collection: 'learning-paths' | 'courses' | 'service-categories' | 'knowledge-articles', value: string) => {
  const result = await payload.find({ collection, where: { slug: { equals: value } }, limit: 1, overrideAccess: true })
  return result.docs[0]
}

const seed = async () => {
  const payload = await getPayload({ config }) as any
  const existingPath = await findBySlug(payload, 'learning-paths', onboardingPath.id)
  const path = existingPath ?? await payload.create({
    collection: 'learning-paths',
    data: { title: onboardingPath.title, slug: onboardingPath.id, summary: onboardingPath.summary, defaultDueDays: 7, isDefaultOnboarding: true, courses: [] },
    overrideAccess: true,
  })

  const courseIds: Array<string | number> = []
  for (const course of onboardingPath.courses) {
    const createdCourse = await findBySlug(payload, 'courses', course.id) ?? await payload.create({
      collection: 'courses',
      data: { title: course.title, slug: course.id, path: path.id, order: course.order, summary: course.summary, category: course.category, durationMinutes: course.durationMinutes, units: [] },
      overrideAccess: true,
    })
    courseIds.push(createdCourse.id)
    const unitIds: Array<string | number> = []
    for (const unit of course.units) {
      const units = await payload.find({ collection: 'units', where: { and: [{ course: { equals: createdCourse.id } }, { title: { equals: unit.title } }] }, limit: 1, overrideAccess: true })
      const createdUnit = units.docs[0] ?? await payload.create({
        collection: 'units',
        data: { title: unit.title, course: createdCourse.id, order: unit.order, description: unit.description, type: unit.type, durationMinutes: unit.durationMinutes, externalUrl: unit.externalUrl },
        overrideAccess: true,
      })
      unitIds.push(createdUnit.id)
    }
    await payload.update({ collection: 'courses', id: createdCourse.id, data: { units: unitIds }, overrideAccess: true })
  }
  await payload.update({ collection: 'learning-paths', id: path.id, data: { courses: courseIds }, overrideAccess: true })

  const categoryIds = new Map<string, string | number>()
  for (const question of questionBank) {
    if (categoryIds.has(question.categoryId)) continue
    const existingCategory = await payload.find({ collection: 'question-categories', where: { name: { equals: question.categoryId } }, limit: 1, overrideAccess: true })
    const category = existingCategory.docs[0] ?? await payload.create({ collection: 'question-categories', data: { name: question.categoryId }, overrideAccess: true })
    categoryIds.set(question.categoryId, category.id)
  }
  const existingRule = await payload.find({ collection: 'quiz-rules', where: { name: { equals: '入职基础测评' } }, limit: 1, overrideAccess: true })
  const quizRule = existingRule.docs[0] ?? await payload.create({
    collection: 'quiz-rules',
    data: {
      name: '入职基础测评',
      categories: [...categoryIds.values()],
      questionCount: 3,
      passScore: 80,
    },
    overrideAccess: true,
  })
  const firstCourse = await payload.find({ collection: 'courses', where: { slug: { equals: onboardingPath.courses[0].id } }, depth: 1, limit: 1, overrideAccess: true })
  const seededCourse = firstCourse.docs[0]
  const seededUnits = (seededCourse?.units as Array<{ id: string | number }> | undefined) ?? []
  if (seededUnits[0]) await payload.update({ collection: 'units', id: seededUnits[0].id, data: { quizRule: quizRule.id }, overrideAccess: true })
  for (const question of questionBank) {
    const course = await findBySlug(payload, 'courses', question.courseId)
    const existingQuestion = await payload.find({ collection: 'questions', where: { prompt: { equals: question.prompt } }, limit: 1, overrideAccess: true })
    if (existingQuestion.docs[0]) continue
    await payload.create({
      collection: 'questions',
      data: {
        course: course?.id ?? seededCourse?.id,
        category: categoryIds.get(question.categoryId),
        type: question.type,
        prompt: question.prompt,
        options: question.options.map((option) => ({ optionId: option.id, label: option.label, correct: question.correctOptionIds.includes(option.id) })),
        explanation: question.explanation,
        difficulty: question.difficulty,
        active: true,
        status: 'published',
      },
      overrideAccess: true,
    })
  }

  const serviceCategoryIds = new Map<string, string | number>()
  for (const article of serviceArticles) {
    if (!serviceCategoryIds.has(article.category)) {
      const existingCategory = await findBySlug(payload, 'service-categories', slug(article.category))
      const category = existingCategory ?? await payload.create({ collection: 'service-categories', data: { name: article.category, slug: slug(article.category), order: serviceCategoryIds.size }, overrideAccess: true })
      serviceCategoryIds.set(article.category, category.id)
    }
    const bodyText = article.sections?.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.items ?? [])]).join('\n') ?? ''
    const existingArticle = await findBySlug(payload, 'knowledge-articles', article.id)
    if (existingArticle) continue
    await payload.create({
      collection: 'knowledge-articles',
      data: {
        title: article.title,
        slug: article.id,
        summary: article.summary,
        type: article.type,
        bodyText,
        source: article.source,
        category: serviceCategoryIds.get(article.category),
        externalUrl: article.url,
        tags: article.tags.map((label) => ({ label })),
        status: 'published',
      },
      overrideAccess: true,
    })
  }
  console.log(`Seeded ${courseIds.length} course(s), ${questionBank.length} question(s), ${serviceArticles.length} service article(s).`)
}

await seed()
