'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import type { ServiceArticle } from '@/lib/types'

type DepartmentCategory = ServiceArticle['category']

const categories: DepartmentCategory[] = ['HR', '行政', 'IT']
const featuredIds = new Set(['service-leave', 'service-expense', 'service-vpn'])

interface ServiceRowsProps {
  articles: ServiceArticle[]
}

function ServiceRows({ articles }: ServiceRowsProps) {
  return articles.map((article) => (
    <Link className="service-result interactive-row" href={article.url ?? `/services/${article.id}`} key={article.id} target={article.url ? '_blank' : undefined} rel={article.url ? 'noreferrer' : undefined}>
      <span className="service-result__category">{article.category}</span>
      <span><h3>{article.title}</h3><p>{article.summary}</p></span>
      <span className="row-arrow" aria-hidden="true">{article.url ? '↗' : '→'}</span>
    </Link>
  ))
}

export function ServiceSearch({ articles }: { articles: ServiceArticle[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DepartmentCategory>('HR')
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase())

  const matchedArticles = useMemo(
    () => articles.filter((article) => {
      const haystack = `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase()
      return !deferredQuery || haystack.includes(deferredQuery)
    }),
    [articles, deferredQuery],
  )

  const featuredArticles = matchedArticles.filter((article) => featuredIds.has(article.id))

  return (
    <>
      <label className="service-search">
        <Search size={19} strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">搜索知识和办事入口</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索请假、报销、VPN…" />
        <kbd>⌘K</kbd>
      </label>

      {featuredArticles.length ? (
        <section className="service-group service-group--featured" aria-labelledby="service-group-featured">
          <header className="service-group__heading">
            <div><h2 id="service-group-featured">高频问题</h2><p>同事最近最常查找的流程</p></div>
            <span>{featuredArticles.length} 条</span>
          </header>
          <div><ServiceRows articles={featuredArticles} /></div>
        </section>
      ) : null}

      <section className="service-department-browser" aria-label="按部门查看员工服务">
        <div className="service-tabs" role="tablist" aria-label="员工服务部门">
          {categories.map((item) => (
            <button
              id={`service-tab-${item}`}
              type="button"
              role="tab"
              aria-selected={category === item}
              aria-controls={`service-panel-${item}`}
              data-active={category === item}
              onClick={() => setCategory(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        {categories.map((item) => {
          const departmentArticles = matchedArticles.filter((article) => article.category === item && !featuredIds.has(article.id))
          return (
            <div className="service-department-panel" id={`service-panel-${item}`} role="tabpanel" aria-labelledby={`service-tab-${item}`} tabIndex={0} hidden={category !== item} key={item}>
              {departmentArticles.length ? <ServiceRows articles={departmentArticles} /> : (
                <div className="empty-state empty-state--compact"><p>当前筛选下没有相关内容。</p></div>
              )}
            </div>
          )
        })}
      </section>
    </>
  )
}
