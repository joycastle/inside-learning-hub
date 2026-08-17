'use client'

import { useEffect, useState } from 'react'
import type { FeishuOrganization } from '@/lib/types'

export function useFeishuOrganization(initialOrganization: FeishuOrganization) {
  const [organization, setOrganization] = useState(initialOrganization)
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/v1/admin/feishu/organization', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<FeishuOrganization> : null)
      .then((result) => {
        if (active && result) setOrganization(result)
      })
      .finally(() => {
        if (active) setSyncing(false)
      })
    return () => {
      active = false
    }
  }, [])

  const sync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/v1/admin/feishu/organization', { cache: 'no-store' })
      if (response.ok) setOrganization(await response.json() as FeishuOrganization)
    } finally {
      setSyncing(false)
    }
  }

  return { organization, syncing, sync }
}
