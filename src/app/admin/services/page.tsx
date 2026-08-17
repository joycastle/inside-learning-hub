import { redirect } from 'next/navigation'

export default function ServicesManagementPage() {
  redirect(`${process.env.CMS_PUBLIC_BASE_URL ?? 'http://localhost:3001'}/cms`)
}
