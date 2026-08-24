'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export function HtmlDocumentPreview({ title, url }: { title: string; url: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState('')
  const baseHref = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    try {
      return new URL('.', new URL(url, window.location.href)).href
    } catch {
      return window.location.href
    }
  }, [url])

  useEffect(() => {
    let active = true
    fetch(url, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('HTML 文件加载失败')
        return response.text()
      })
      .then((value) => { if (active) { setError(''); setContent(value) } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'HTML 文件加载失败') })
    return () => { active = false }
  }, [url])

  const renderedContent = content && baseHref
    ? content.replace(/<head(\s[^>]*)?>/i, (match) => `${match}<base href="${baseHref}">`)
    : content

  return (
    <div className="document-preview document-preview--html">
      {renderedContent ? (
        <iframe
          className="document-preview__frame document-preview__frame--html"
          title={`${title} HTML 预览`}
          srcDoc={renderedContent}
          sandbox="allow-scripts allow-forms allow-popups"
        />
      ) : error ? (
        <div className="document-preview__loading" role="alert">{error}</div>
      ) : (
        <div className="document-preview__loading" aria-busy="true">正在加载 HTML 预览…</div>
      )}
      <div className="document-preview__toolbar">
        <span>已按网页效果渲染</span>
        <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer">
          在新窗口打开 HTML 讲义<ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
