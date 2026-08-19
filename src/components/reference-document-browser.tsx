'use client'

import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReferenceDocument } from '@/lib/types'

export function ReferenceDocumentBrowser({ documents }: { documents: ReferenceDocument[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const categories = [...new Set(documents.map((document) => document.category).filter(Boolean))] as string[]
  const visible = useMemo(() => documents.filter((document) => {
    const haystack = `${document.title} ${document.summary} ${document.tags.join(' ')}`.toLocaleLowerCase('zh-CN')
    return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase('zh-CN'))) && (category === 'all' || document.category === category)
  }), [category, documents, query])
  return <section className="reference-document-browser" aria-label="参考文档列表"><div className="reference-document-browser__filters"><label className="admin-search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索参考文档</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文档标题、说明或标签" /></label><select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">全部分类</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="reference-document-grid">{visible.map((document) => <Link className="reference-document-card" href={`/documents/${document.id}`} key={document.id}><span className="reference-document-card__icon"><FileText size={20} aria-hidden="true" /></span><span><strong>{document.title}</strong><small>{document.summary}</small><em>{document.category || '未分类'} · {document.fileType?.toUpperCase() ?? '文档'}{document.required ? ' · 必读' : ''}</em></span><span aria-hidden="true">→</span></Link>)}{!visible.length ? <p className="empty-state">暂无匹配的参考文档。</p> : null}</div></section>
}
