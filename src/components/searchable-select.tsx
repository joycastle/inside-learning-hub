'use client'

import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type SearchableSelectOption = { value: string; label: string; searchText?: string }

export function SearchableSelect({
  name,
  value,
  options,
  onChange,
  placeholder = '请选择',
  searchPlaceholder = '搜索…',
  disabled = false,
  required = false,
}: {
  name?: string
  value: string
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  required?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 })
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN')
    if (!normalized) return options
    return options.filter((option) => `${option.label} ${option.searchText ?? ''}`.toLocaleLowerCase('zh-CN').includes(normalized))
  }, [options, query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const trigger = rootRef.current?.querySelector<HTMLButtonElement>('.searchable-select__trigger')
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const gap = 6
      const viewportPadding = 8
      const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding
      const availableAbove = rect.top - gap - viewportPadding
      const openBelow = availableBelow >= Math.min(280, availableAbove)
      const maxHeight = Math.max(160, Math.min(280, openBelow ? availableBelow : availableAbove))
      setMenuPosition({
        top: openBelow ? rect.bottom + gap : Math.max(viewportPadding, rect.top - gap - maxHeight),
        left: Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - rect.width - viewportPadding),
        width: rect.width,
        maxHeight,
      })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  const choose = (nextValue: string) => {
    onChange(nextValue)
    setQuery('')
    setOpen(false)
  }

  return <div className="searchable-select" ref={rootRef} data-open={open}>
    {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
    <button className="form-control searchable-select__trigger" type="button" aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)}>
      <span className={selected ? '' : 'searchable-select__placeholder'}>{selected?.label ?? placeholder}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open ? createPortal(<div className="searchable-select__menu searchable-select__menu--portal" ref={menuRef} role="listbox" style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}>
      <label className="searchable-select__search"><Search size={15} aria-hidden="true" /><span className="sr-only">{searchPlaceholder}</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} /></label>
      <div className="searchable-select__options">
        {filtered.map((option) => <button className="searchable-select__option" data-selected={option.value === value} type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => choose(option.value)}><span>{option.label}</span>{option.value === value ? <Check size={15} aria-hidden="true" /> : null}</button>)}
        {!filtered.length ? <p className="searchable-select__empty">没有找到匹配项</p> : null}
      </div>
    </div>, document.body) : null}
  </div>
}
