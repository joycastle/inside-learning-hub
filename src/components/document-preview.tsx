import { ExternalLink } from 'lucide-react'

interface DocumentPreviewProps {
  title: string
  type: 'pdf' | 'video' | 'html'
  url: string
}

export function DocumentPreview({ title, type, url }: DocumentPreviewProps) {
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

  if (type === 'html') {
    return (
      <div className="document-preview">
        {/*
         * HTML 讲义常包含目录切换、交互图表等脚本。允许脚本但不授予
         * same-origin，避免上传内容读取主站 cookie 或操作主页面。
         */}
        <iframe className="document-preview__frame document-preview__frame--html" title={`${title} HTML 预览`} src={url} sandbox="allow-scripts allow-forms allow-popups" />
        <a className="document-preview__fallback" href={url} target="_blank" rel="noreferrer">在新窗口打开 HTML 讲义<ExternalLink size={14} aria-hidden="true" /></a>
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
