import Image from 'next/image'
import Link from 'next/link'

export interface BrandMarkProps {
  href?: string
  inverse?: boolean
  label?: string
}

export function BrandMark({ href = '/home', inverse = false, label = '乐堡家园' }: BrandMarkProps) {
  return (
    <Link className={`brand${inverse ? ' brand--inverse' : ''}`} href={href} aria-label={`${label}首页`}>
      <span className="brand-mark" aria-hidden="true">
        <Image src="/company-logo.png" alt="" width={36} height={36} priority />
      </span>
      <span className="brand__name">{label}</span>
    </Link>
  )
}
