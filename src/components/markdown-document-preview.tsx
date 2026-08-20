'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export function MarkdownDocumentPreview({ title, url, initialContent }: { title: string; url?: string; initialContent?: string }) {
  const [content, setContent] = useState<string | null>(initialContent ?? null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (initialContent !== undefined || !url) return
    fetch(url, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Markdown 文件加载失败')
        return response.text()
      })
      .then((value) => { if (active) setContent(value) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Markdown 文件加载失败') })
    return () => { active = false }
  }, [initialContent, url])

  if (error) return <div className="document-preview document-preview__fallback"><p>{error}</p>{url ? <a className="button button--primary" href={url} target="_blank" rel="noreferrer" download>下载 Markdown 文件<ExternalLink size={14} aria-hidden="true" /></a> : null}</div>
  if (content === null) return <div className="document-preview document-preview__loading" aria-busy="true">正在加载文档…</div>
  return <div className="document-preview document-preview--markdown"><article className="markdown-document-content" aria-label={`${title}内容`}><ReactMarkdown>{content}</ReactMarkdown></article>{url ? <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer" download>下载 Markdown 文件<ExternalLink size={14} aria-hidden="true" /></a> : null}</div>
}
