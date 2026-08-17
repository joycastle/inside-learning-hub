import { redirect } from 'next/navigation'

export default function TrainingManagementPage() {
  redirect(`${process.env.CMS_PUBLIC_BASE_URL ?? 'http://localhost:3001'}/cms/collections/learning-paths`)
}
