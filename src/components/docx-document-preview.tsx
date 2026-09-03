'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'

export function DocxDocumentPreview({ title, url }: { title: string; url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=1`

  useEffect(() => {
    let active = true
    const container = containerRef.current
    if (!container) return () => undefined
    container.replaceChildren()
    setError('')
    fetch(url, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Word 文件加载失败')
        return response.arrayBuffer()
      })
      .then((buffer) => renderAsync(buffer, container, undefined, { inWrapper: false, breakPages: true, ignoreWidth: false }))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Word 文件加载失败')
      })
    return () => { active = false; container.replaceChildren() }
  }, [url])

  return (
    <div className="document-preview document-preview--document">
      {error ? <div className="document-preview__loading" role="alert">{error}</div> : <div ref={containerRef} className="docx-document-preview" aria-label={`${title} 文档预览`} />}
      <div className="document-preview__toolbar">
        <span>已按 Word 文档内容渲染</span>
        <a className="document-preview__fallback" href={downloadUrl} download>
          下载 Word 文档<ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
