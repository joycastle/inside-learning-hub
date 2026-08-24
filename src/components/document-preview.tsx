import { ExternalLink } from 'lucide-react'
import { HtmlDocumentPreview } from '@/components/html-document-preview'
import { MarkdownDocumentPreview } from '@/components/markdown-document-preview'

interface DocumentPreviewProps {
  title: string
  type: 'pdf' | 'video' | 'html' | 'markdown' | 'image' | 'document' | 'download'
  url: string
}

export function DocumentPreview({ title, type, url }: DocumentPreviewProps) {
  if (type === 'download') {
    return <div className="document-preview document-preview__fallback"><p>该文件暂不支持网页内预览。</p><a className="button button--primary" href={url} target="_blank" rel="noreferrer" download>下载并打开文档<ExternalLink size={14} aria-hidden="true" /></a></div>
  }
  if (type === 'video') {
    return (
      <div className="document-preview">
        <video className="document-preview__video" controls playsInline preload="metadata" src={url}>
          当前浏览器不支持视频播放。
        </video>
        <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer">
          在新窗口打开视频<ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    )
  }

  if (type === 'image') {
    return <div className="document-preview document-preview--image"><img className="document-preview__image" src={url} alt={title} /><a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer">在新窗口打开图片<ExternalLink size={14} aria-hidden="true" /></a></div>
  }

  if (type === 'markdown') return <MarkdownDocumentPreview title={title} url={url} />

  if (type === 'html') {
    return <HtmlDocumentPreview title={title} url={url} />
  }

  if (type === 'document') {
    return (
      <div className="document-preview document-preview--document">
        <iframe className="document-preview__frame" title={`${title} 文档预览`} src={url} />
        <div className="document-preview__toolbar">
          <span>浏览器支持时会直接显示文档；若未显示，可打开或下载文件。</span>
          <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer" download>
            打开 / 下载文档<ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="document-preview">
      <iframe className="document-preview__frame" title={`${title} PDF 预览`} src={url} />
      <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer">
        如果预览区域为空，请在新窗口打开 PDF<ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  )
}
