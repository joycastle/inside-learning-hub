import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchableSelect } from './searchable-select'

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
})
