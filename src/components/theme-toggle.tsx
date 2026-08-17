'use client'

import { Moon, Sun } from 'lucide-react'

const themeStorageKey = 'lebao-theme-v2'

export function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement
    const current = root.dataset.theme ?? 'light'
    const nextTheme = current === 'dark' ? 'light' : 'dark'
    const applyTheme = () => {
      root.dataset.theme = nextTheme
      root.style.colorScheme = nextTheme
      window.localStorage.setItem(themeStorageKey, nextTheme)
    }

    if ('startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(applyTheme)
      return
    }
    applyTheme()
  }

  return (
    <button className="icon-button theme-toggle" type="button" aria-label="切换明暗主题" onClick={toggleTheme}>
      <Sun className="theme-toggle__sun" size={18} aria-hidden="true" />
      <Moon className="theme-toggle__moon" size={18} aria-hidden="true" />
    </button>
  )
}
