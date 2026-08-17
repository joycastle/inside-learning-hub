import { redirect } from 'next/navigation'

export default function QuestionManagementPage() {
  redirect(`${process.env.CMS_PUBLIC_BASE_URL ?? 'http://localhost:3001'}/cms/collections/questions`)
}
