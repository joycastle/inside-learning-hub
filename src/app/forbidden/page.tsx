import Link from 'next/link'
import { LockKeyhole } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <main className="login-panel">
      <div className="login-box">
        <LockKeyhole size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="forbidden-title">没有管理权限</h2>
        <p>当前账号不能访问管理端。如职责发生变化，请联系超级管理员调整权限。</p>
        <Link className="button button--primary" href="/home">返回员工端</Link>
      </div>
    </main>
  )
}
