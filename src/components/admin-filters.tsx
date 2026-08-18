'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { useFeishuOrganization } from '@/lib/use-feishu-organization'
import { SearchableSelect } from '@/components/searchable-select'
import type { FeishuOrganization } from '@/lib/types'

export interface AdminFiltersProps {
  organization: FeishuOrganization
  showSearch?: boolean
  searchPlaceholder?: string
  defaults?: {
    dateFrom?: string
    dateTo?: string
    department?: string
    path?: string
    query?: string
  }
}

const formatInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultRange = () => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - 29)
  return { dateFrom: formatInputDate(start), dateTo: formatInputDate(end) }
}

export function AdminFilters({ organization: initialOrganization, showSearch = false, searchPlaceholder = '搜索员工或内容', defaults }: AdminFiltersProps) {
  const defaultRange = getDefaultRange()
  const [dateFrom, setDateFrom] = useState(defaults?.dateFrom ?? defaultRange.dateFrom)
  const [dateTo, setDateTo] = useState(defaults?.dateTo ?? defaultRange.dateTo)
  const [department, setDepartment] = useState(defaults?.department ?? 'all')
  const [path, setPath] = useState(defaults?.path ?? 'onboarding')
  const { organization, syncing } = useFeishuOrganization(initialOrganization)

  return (
    <form className="admin-filters" action="" method="get">
      {showSearch ? (
        <label className="admin-search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">搜索</span>
          <input name="q" type="search" defaultValue={defaults?.query} placeholder={searchPlaceholder} />
        </label>
      ) : null}
      <fieldset className="admin-date-range">
        <legend>统计日期</legend>
        <div className="admin-date-range__control">
          <input name="dateFrom" type="date" aria-label="开始日期" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} />
          <span>至</span>
          <input name="dateTo" type="date" aria-label="结束日期" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </fieldset>
      <label>
        <span>部门 · {syncing ? '同步中' : '飞书组织架构'}</span>
        <SearchableSelect name="department" value={department} onChange={setDepartment} placeholder="全部部门" searchPlaceholder="搜索部门" options={[{ value: 'all', label: '全部部门' }, ...organization.departments.map((item) => ({ value: item.name, label: item.name }))]} />
      </label>
      <label>
        <span>培训路径</span>
        <SearchableSelect name="path" value={path} onChange={setPath} placeholder="请选择培训路径" searchPlaceholder="搜索培训路径" options={[{ value: 'onboarding', label: '新员工入职学习路径' }]} />
      </label>
      <button className="button button--secondary" type="submit">应用筛选</button>
    </form>
  )
}
