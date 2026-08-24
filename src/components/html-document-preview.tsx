'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const responsivePreviewStyle = `<style data-joyhome-preview="responsive">
html { overflow-x: hidden !important; }
body { transform: scale(var(--joyhome-preview-scale, 1)); transform-origin: top left; width: calc(100% / var(--joyhome-preview-scale, 1)); }
img, svg, video, canvas, table { max-width: 100%; }
</style>`

const responsivePreviewScript = `<script data-joyhome-preview="responsive">(() => {
  const root = document.documentElement
  const body = document.body
  if (!body) return
  let frame = 0
  const fit = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      root.style.setProperty('--joyhome-preview-scale', '1')
      const contentWidth = Math.max(root.scrollWidth, body.scrollWidth)
      const scale = Math.min(1, Math.max(0.25, window.innerWidth / Math.max(contentWidth, 1)))
      root.style.setProperty('--joyhome-preview-scale', String(scale))
    })
  }
  window.addEventListener('resize', fit)
  window.addEventListener('load', fit)
  new ResizeObserver(fit).observe(body)
  fit()
})()</script>`

const prepareHtmlPreview = (content: string, baseHref: string) => {
  let prepared = content.replace(/<head(\s[^>]*)?>/i, (match) => `${match}<base href="${baseHref}">${responsivePreviewStyle}`)
  prepared = prepared.replace(/(<a\b[^>]*\bhref=)(["'])([^"']+)(\2)/gi, (match, prefix, quote, href, closingQuote) => {
    if (/^(?:#|mailto:|tel:|javascript:|data:|https?:\/\/)/i.test(href)) return match
    try {
      const resolved = new URL(href, baseHref)
      if (!/\.(?:html?|xhtml)$/i.test(resolved.pathname)) return match
      const previewUrl = `/documents/html-preview?url=${encodeURIComponent(resolved.href)}`
      return `${prefix}${quote}${previewUrl}${closingQuote}`
    } catch {
      return match
    }
  })
  prepared = prepared.replace(/<\/body>/i, `${responsivePreviewScript}</body>`)
  if (!/<head(?:\s[^>]*)?>/i.test(prepared)) prepared = `${responsivePreviewStyle}${prepared}`
  if (!/<\/body>/i.test(prepared)) prepared += responsivePreviewScript
  return prepared
}

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

  const renderedContent = content && baseHref ? prepareHtmlPreview(content, baseHref) : content

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
