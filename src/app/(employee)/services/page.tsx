import { ServiceSearch } from '@/components/service-search'
import { getServiceArticles } from '@/lib/api/server'

export const metadata = { title: '员工服务' }

export default async function ServicesPage() {
  const serviceArticles = await getServiceArticles()
  return (
    <div className="page-container main-content">
      <header className="services-header">
        <div>
          <h1 className="page-heading">需要什么帮助？</h1>
          <p className="page-description">搜索制度说明和办事入口。找不到时，可直接联系对应部门负责人。</p>
        </div>
      </header>
      <ServiceSearch articles={serviceArticles} />
    </div>
  )
}
