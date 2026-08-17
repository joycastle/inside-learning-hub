'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, BookOpen, FileText, Search, X } from 'lucide-react'
import Link from 'next/link'

interface CourseSearchResult {
  id: string
  title: string
  summary: string
  category: string
}

interface UnitSearchResult {
  id: string
  courseId: string
  title: string
  description: string
}

interface ServiceSearchResult {
  id: string
  title: string
  summary: string
  category: string
  url?: string
}

interface HeaderSearchPayload {
  courses: CourseSearchResult[]
  units: UnitSearchResult[]
  services: ServiceSearchResult[]
}

const emptyResults: HeaderSearchPayload = { courses: [], units: [], services: [] }

export function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HeaderSearchPayload>(emptyResults)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const normalizedQuery = query.trim()
  const resultCount = results.courses.length + results.units.length + results.services.length

  useEffect(() => {
    const openWithShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', openWithShortcut)
    return () => window.removeEventListener('keydown', openWithShortcut)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!normalizedQuery) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('搜索请求失败')
        setResults((await response.json()) as HeaderSearchPayload)
        setFailed(false)
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setResults(emptyResults)
        setFailed(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [normalizedQuery])

  const closePalette = () => setOpen(false)
  const updateQuery = (value: string) => {
    setQuery(value)
    setFailed(false)
    if (value.trim()) {
      setLoading(true)
    } else {
      setLoading(false)
      setResults(emptyResults)
    }
  }

  const palette = open ? (
    <div className="command-palette" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) closePalette()
    }}>
      <section className="command-palette__dialog" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
        <h2 className="sr-only" id="command-palette-title">搜索课程或员工服务</h2>
        <div className="command-palette__input">
          <Search size={20} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="搜索课程、学习单元或员工服务…"
          />
          <button type="button" aria-label="关闭搜索" onClick={closePalette}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="command-palette__results" id="command-search-results" aria-live="polite">
          {!normalizedQuery ? <p className="command-palette__state">输入关键词，搜索全部课程、学习单元和员工服务。</p> : null}
          {loading ? <p className="command-palette__state">正在搜索…</p> : null}
          {!loading && failed ? <p className="command-palette__state">搜索暂时不可用，请稍后重试。</p> : null}
          {!loading && !failed && normalizedQuery && !resultCount ? <p className="command-palette__state">没有找到相关内容</p> : null}

          {!loading && results.courses.map((course) => (
            <Link className="command-palette__result" href={`/learn/${course.id}`} key={`course-${course.id}`} onClick={closePalette}>
              <BookOpen size={17} aria-hidden="true" />
              <span><small>课程 · {course.category}</small><strong>{course.title}</strong></span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
          {!loading && results.units.map((unit) => (
            <Link className="command-palette__result" href={`/learn/${unit.courseId}/${unit.id}`} key={`unit-${unit.id}`} onClick={closePalette}>
              <BookOpen size={17} aria-hidden="true" />
              <span><small>学习单元</small><strong>{unit.title}</strong></span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
          {!loading && results.services.map((service) => (
            <Link
              className="command-palette__result"
              href={service.url ?? `/services/${service.id}`}
              key={`service-${service.id}`}
              target={service.url ? '_blank' : undefined}
              rel={service.url ? 'noreferrer' : undefined}
              onClick={closePalette}
            >
              <FileText size={17} aria-hidden="true" />
              <span><small>员工服务 · {service.category}</small><strong>{service.title}</strong></span>
              <span className="row-arrow" aria-hidden="true">{service.url ? '↗' : '→'}</span>
            </Link>
          ))}
        </div>
        <footer className="command-palette__footer"><kbd>ESC</kbd> 关闭 · 点击结果前往对应内容</footer>
      </section>
    </div>
  ) : null

  return (
    <>
      <button className="header-search-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>搜索课程或服务</span>
        <kbd>⌘K</kbd>
      </button>
      {palette ? createPortal(palette, document.body) : null}
    </>
  )
}
