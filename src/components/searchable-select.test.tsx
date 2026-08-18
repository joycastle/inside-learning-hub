import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchableSelect } from './searchable-select'

afterEach(cleanup)

describe('SearchableSelect', () => {
  it('filters large option lists and preserves the selected form value', () => {
    const onChange = vi.fn()
    render(<SearchableSelect name="department" value="" onChange={onChange} options={[{ value: 'all', label: '全部部门' }, { value: 'research', label: '研发中心' }, { value: 'market', label: '市场部' }]} />)

    fireEvent.click(screen.getByRole('button', { name: '请选择' }))
    fireEvent.change(screen.getByPlaceholderText('搜索…'), { target: { value: '研发' } })
    expect(screen.getByRole('option', { name: '研发中心' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '市场部' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: '研发中心' }))
    expect(onChange).toHaveBeenCalledWith('research')
    expect(screen.getByDisplayValue('')).toHaveAttribute('name', 'department')
  })

  it('searches custom email and department text', () => {
    render(<SearchableSelect value="" onChange={vi.fn()} searchPlaceholder="搜索姓名或邮箱" options={[{ value: '1', label: '未填写邮箱 · 小王', searchText: '小王 wang@example.com 研发部' }]} />)

    fireEvent.click(screen.getByRole('button', { name: '请选择' }))
    fireEvent.change(screen.getByPlaceholderText('搜索姓名或邮箱'), { target: { value: 'wang@example.com' } })

    expect(screen.getByRole('option', { name: '未填写邮箱 · 小王' })).toBeInTheDocument()
  })
})
