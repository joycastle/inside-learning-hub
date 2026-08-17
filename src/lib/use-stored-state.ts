'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

export function useStoredState<T>(key: string, initialValue: T) {
  const fallbackSnapshot = useMemo(() => JSON.stringify(initialValue), [initialValue])
  const eventName = `local-storage:${key}`
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(eventName, onStoreChange)
    window.addEventListener('storage', onStoreChange)
    return () => {
      window.removeEventListener(eventName, onStoreChange)
      window.removeEventListener('storage', onStoreChange)
    }
  }, [eventName])
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) ?? fallbackSnapshot, [fallbackSnapshot, key])
  const getServerSnapshot = useCallback(() => fallbackSnapshot, [fallbackSnapshot])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const value = useMemo(() => {
    try {
      return JSON.parse(snapshot) as T
    } catch {
      return initialValue
    }
  }, [initialValue, snapshot])

  const setValue = useCallback((nextValue: T | ((current: T) => T)) => {
    const currentSnapshot = window.localStorage.getItem(key) ?? fallbackSnapshot
    let currentValue = initialValue
    try {
      currentValue = JSON.parse(currentSnapshot) as T
    } catch {
      window.localStorage.removeItem(key)
    }
    const resolvedValue = typeof nextValue === 'function' ? (nextValue as (current: T) => T)(currentValue) : nextValue
    window.localStorage.setItem(key, JSON.stringify(resolvedValue))
    window.dispatchEvent(new Event(eventName))
  }, [eventName, fallbackSnapshot, initialValue, key])

  return [value, setValue] as const
}
