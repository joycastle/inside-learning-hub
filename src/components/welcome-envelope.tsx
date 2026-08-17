'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export interface WelcomeEnvelopeProps {
  userId: string
}

const STORAGE_VERSION = 2
const EXIT_DURATION_MS = 220

export function WelcomeEnvelope({ userId }: WelcomeEnvelopeProps) {
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
  const visible = !seen && !dismissedForPage

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
        <div className="welcome-envelope__packet">
          <div className="welcome-envelope__back" aria-hidden="true" />
          <section className="welcome-envelope__letter">
            <div className="welcome-envelope__letterhead" aria-hidden="true">
              <Image src="/company-logo.png" width={28} height={28} alt="" priority />
              <span>乐堡家园</span>
            </div>
            <h2 id="welcome-envelope-title">
              欢迎来到乐堡家园，希望在这里我们共同成长！
            </h2>
            <button className="button button--primary welcome-envelope__confirm" type="button" onClick={dismiss}>
              确定
            </button>
          </section>
          <div className="welcome-envelope__front" aria-hidden="true" />
          <div className="welcome-envelope__flap" aria-hidden="true" />
        </div>
      </div>
    </dialog>
  )
}
