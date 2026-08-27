import type { Metadata } from 'next'
import Script from 'next/script'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: '乐堡家园 · 内部学习与服务',
    template: '%s · 乐堡家园',
  },
  description: '公司内部培训与员工服务中心',
  icons: {
    icon: [{ url: '/company-logo.png', type: 'image/png' }],
    apple: [{ url: '/company-logo.png', type: 'image/png' }],
  },
}

const designContract = `
<!--
THESIS: 让内部培训与员工服务像一套精密、安静的工作工具，拒绝传统企业门户的厚重装饰和卡片堆叠。
OWN-WORLD: 近白中性色、Geist 字形、Logo 蓝单一强调色、8px 控件圆角与发丝边框；层级只依靠空间、字重和状态反馈。
STORY: 员工立即继续入职视频或找到服务答案；管理员在更高密度的同一系统中完成配置、核对和导出。
FIRST VIEWPORT: 紧凑全宽导航之下保留宽阔内容留白，唯一入职任务成为主要表面，员工服务与运营数据按任务优先级展开。
FORM: Linear / Vercel 式操作界面，融合 Stripe 的信息清晰度与 Apple 的克制运动，canon direction 2026-08-14。
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {"try{const n=localStorage.getItem('lebao-theme-v2')||'light';document.documentElement.dataset.theme=n;document.documentElement.style.colorScheme=n}catch(e){}"}
        </Script>
      </head>
      <body>
        <template dangerouslySetInnerHTML={{ __html: designContract }} />
        {children}
      </body>
    </html>
  )
}
