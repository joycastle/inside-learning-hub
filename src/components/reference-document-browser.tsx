'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReferenceDocument } from '@/lib/types'

const fileTypeLabel: Record<NonNullable<ReferenceDocument['fileType']>, string> = {
  markdown: '文档',
  html: '网页',
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  video: '视频',
  image: '图片',
  link: '链接',
}

export function ReferenceDocumentBrowser({ documents }: { documents: ReferenceDocument[] }) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => documents.filter((document) => {
    const haystack = `${document.title} ${document.summary} ${document.tags.join(' ')}`.toLocaleLowerCase('zh-CN')
    return !query.trim() || haystack.includes(query.trim().toLocaleLowerCase('zh-CN'))
  }), [documents, query])

  return (
    <section className="reference-document-browser" aria-label="参考文档列表">
      <label className="service-search">
        <Search size={19} strokeWidth={1.8} aria-hidden="true" />
        <span className="sr-only">搜索参考文档</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文档标题、说明或标签" />
      </label>

      <section className="service-group" aria-labelledby="reference-document-group">
        <header className="service-group__heading">
          <div>
            <h2 id="reference-document-group">全部资料</h2>
            <p>点开即可阅读，也可以下载原文件</p>
          </div>
          <span>{visible.length} 份</span>
        </header>
        <div>
          {visible.map((document) => (
            <Link className="service-result interactive-row" href={`/documents/${document.id}`} key={document.id}>
              <span className="service-result__category">{fileTypeLabel[document.fileType ?? 'markdown'] ?? '文档'}</span>
              <span>
                <h3>{document.title}</h3>
                <p>{document.summary}{document.required ? ' · 新人必读' : ''}</p>
              </span>
              <span className="row-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
          {!visible.length ? <p className="empty-state empty-state--compact">暂无匹配的参考文档。</p> : null}
        </div>
      </section>
    </section>
  )
}
