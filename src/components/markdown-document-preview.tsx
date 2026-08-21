'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const normalizeMarkdown = (value: string) => value
  // 兼容上传文件中由富文本导出产生的多种异常标题写法，例如：
  // `## **1\. ****标题**`、`### **2\.1****标题**`、`### **7****\.1标题**`。
  // 这些内容不是合法的普通标题，直接交给 Markdown 解析器会把星号原样显示出来。
  .replace(/^\s*#{1,6}\s+\*\*(\d+)\s*\\?\.\s*\*{2,}\s*(.*?)\s*\*{0,2}\s*$/gm, (_match, number, heading) => `### ${number}. ${heading.replace(/\*+$/g, '').trim()}`)
  .replace(/^\s*#{1,6}\s+\*\*(\d+)\s*\\?\.\s*(\d+)\s*\*{2,}\s*(.*?)\s*\*{0,2}\s*$/gm, (_match, major, minor, heading) => `### ${major}.${minor} ${heading.replace(/\*+$/g, '').trim()}`)
  .replace(/^\s*#{1,6}\s+\*\*(\d+)\s*\*{2,}\s*\\?\.\s*(\d+)\s*(.*?)\s*\*{0,2}\s*$/gm, (_match, major, minor, heading) => `### ${major}.${minor} ${heading.replace(/\*+$/g, '').trim()}`)
  // 兼容没有外层标题级别的“**1. **标题”写法。
  .replace(/^\s*\*\*\s*(\d+)\s*\\?[.)]\s*\*{2,}\s*(.+?)\s*$/gm, (_match, number, heading) => `### ${number}. ${heading.replace(/\*+$/g, '').trim()}`)

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
  return <div className="document-preview document-preview--markdown"><article className="markdown-document-content" aria-label={`${title}内容`}><ReactMarkdown>{normalizeMarkdown(content)}</ReactMarkdown></article>{url ? <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer" download>下载 Markdown 文件<ExternalLink size={14} aria-hidden="true" /></a> : null}</div>
}
