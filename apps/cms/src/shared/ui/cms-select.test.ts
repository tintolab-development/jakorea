/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CmsSelect } from './cms-select'
import { CmsSelectMultiple } from './cms-select-multiple'

afterEach(cleanup)

describe('CmsSelectMultiple', () => {
  it('trigger mousedown 시 onOpenChange(true)를 호출한다', () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      createElement(CmsSelectMultiple, {
        options: [{ value: 'a', label: 'A' }],
        value: [],
        onChange: vi.fn(),
        onOpenChange,
      })
    )
    const trigger = container.querySelector('button.cms-select-multi__trigger')
    expect(trigger).toBeTruthy()
    fireEvent.mouseDown(trigger!)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('optionsLoading이 true이면 로딩 문구를 표시한다', () => {
    const { container, getByText } = render(
      createElement(CmsSelectMultiple, {
        options: [],
        value: [],
        onChange: vi.fn(),
        optionsLoading: true,
        onOpenChange: vi.fn(),
      })
    )
    const trigger = container.querySelector('button.cms-select-multi__trigger')
    fireEvent.click(trigger!)
    expect(getByText('목록을 불러오는 중입니다.')).toBeInTheDocument()
  })
})

describe('CmsSelect mode=single', () => {
  it('onOpenChange를 Ant Select로 전달한다', () => {
    const onOpenChange = vi.fn()
    render(
      createElement(CmsSelect, {
        options: [{ value: 'dp-1', label: '세부 A' }],
        value: '',
        onOpenChange,
      })
    )
    // ant Select는 combobox role
    const selector = document.querySelector('.ant-select-selector')
    expect(selector).toBeTruthy()
    fireEvent.mouseDown(selector!)
    fireEvent.click(selector!)
    expect(onOpenChange).toHaveBeenCalled()
  })
})

describe('CmsSelect mode=multiple', () => {
  it('onOpenChange·loading을 CmsSelectMultiple로 전달한다', () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      createElement(CmsSelect, {
        mode: 'multiple',
        options: [{ value: 'x', label: 'X' }],
        value: [],
        onOpenChange,
        loading: true,
      })
    )
    const trigger = container.querySelector('button.cms-select-multi__trigger')
    fireEvent.mouseDown(trigger!)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
