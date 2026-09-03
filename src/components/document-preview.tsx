import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { HtmlDocumentPreview } from '@/components/html-document-preview'
import { MarkdownDocumentPreview } from '@/components/markdown-document-preview'
import { DocxDocumentPreview } from '@/components/docx-document-preview'

interface DocumentPreviewProps {
  title: string
  type: 'pdf' | 'video' | 'html' | 'markdown' | 'image' | 'document' | 'download'
  url: string
}

export function DocumentPreview({ title, type, url }: DocumentPreviewProps) {
  const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=1`
  if (type === 'download') {
    return <div className="document-preview document-preview__fallback"><p>该文件暂不支持网页内预览。</p><a className="button button--primary" href={downloadUrl} download>下载文件<ExternalLink size={14} aria-hidden="true" /></a></div>
  }
  if (type === 'video') {
    return (
      <div className="document-preview">
        <video className="document-preview__video" controls playsInline preload="metadata" src={url}>
          当前浏览器不支持视频播放。
        </video>
        <a className="document-preview__fallback" href={downloadUrl} download>
          下载视频<ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    )
  }

  if (type === 'image') {
    return <div className="document-preview document-preview--image"><Image className="document-preview__image" src={url} alt={title} width={1200} height={675} unoptimized /><a className="document-preview__fallback" href={downloadUrl} download>下载图片<ExternalLink size={14} aria-hidden="true" /></a></div>
  }

  if (type === 'markdown') return <MarkdownDocumentPreview title={title} url={url} />

  if (type === 'html') {
    return <HtmlDocumentPreview title={title} url={url} />
  }

  if (type === 'document') {
    return <DocxDocumentPreview title={title} url={url} />
  }

  return (
    <div className="document-preview">
      <iframe className="document-preview__frame" title={`${title} PDF 预览`} src={url} />
      <a className="document-preview__fallback" href={downloadUrl} download>
        下载 PDF<ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  )
}
