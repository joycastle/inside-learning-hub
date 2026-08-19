'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export interface WelcomeEnvelopeProps {
  userId: string
  userEmail?: string
}

const STORAGE_VERSION = 2
const EXIT_DURATION_MS = 220

export function WelcomeEnvelope({ userId, userEmail }: WelcomeEnvelopeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [closing, setClosing] = useState(false)
  const [dismissedForPage, setDismissedForPage] = useState(false)
  const storageKey = `inside:welcome-envelope:${userId}:v${STORAGE_VERSION}`
  const storageEvent = `welcome-envelope:${storageKey}`

  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(storageEvent, onStoreChange)
    window.addEventListener('storage', onStoreChange)
    return () => {
      window.removeEventListener(storageEvent, onStoreChange)
      window.removeEventListener('storage', onStoreChange)
    }
  }, [storageEvent])

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) === 'seen'
    } catch {
      return false
    }
  }, [storageKey])
  const seen = useSyncExternalStore(subscribe, getSnapshot, () => true)
  const alwaysShowForTairui = userEmail?.trim().toLowerCase() === 'tairui@joycastle.mobi'
  const visible = (alwaysShowForTairui || !seen) && !dismissedForPage

  useEffect(() => {
    const dialog = dialogRef.current
    if (!visible || !dialog || dialog.open) return
    dialog.showModal()
  }, [visible])

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
  }, [])

  const dismiss = useCallback(() => {
    if (closing) return
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      dialogRef.current?.close()
      try {
        window.localStorage.setItem(storageKey, 'seen')
        window.dispatchEvent(new Event(storageEvent))
      } catch {
        // 浏览器禁用本地存储时，仅在当前页面中记住已关闭状态。
      }
      setDismissedForPage(true)
      setClosing(false)
    }, EXIT_DURATION_MS)
  }, [closing, storageEvent, storageKey])

  if (!visible) return null

  return (
    <dialog
      className="welcome-envelope"
      data-closing={closing}
      ref={dialogRef}
      aria-labelledby="welcome-envelope-title"
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
    >
      <div className="welcome-envelope__scene">
        <section className="welcome-envelope__card">
          <div className="welcome-envelope__glow" aria-hidden="true" />
          <div className="welcome-envelope__topline">
            <div className="welcome-envelope__letterhead">
              <Image src="/company-logo.png" width={30} height={30} alt="" priority />
              <span>乐堡家园</span>
            </div>
            <span className="welcome-envelope__badge">新成员</span>
          </div>
          <div className="welcome-envelope__content">
            <p className="welcome-envelope__eyebrow">WELCOME TO JOYHOME</p>
            <h2 id="welcome-envelope-title">欢迎来到乐堡家园</h2>
            <p className="welcome-envelope__lead">从这里开始，认识公司、融入团队，也开启你的成长旅程。</p>
            <div className="welcome-envelope__highlights">
              <div><strong>01</strong><span>了解公司与工作方式</span></div>
              <div><strong>02</strong><span>完成新人入职培训</span></div>
              <div><strong>03</strong><span>找到常用员工服务</span></div>
            </div>
          </div>
          <button className="button button--primary welcome-envelope__confirm" type="button" onClick={dismiss}>
            开始探索 <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </dialog>
  )
}
