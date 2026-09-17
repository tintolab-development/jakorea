// @vitest-environment jsdom

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProgramEditInfoActions } from './program-edit-info-actions'

vi.mock('@/shared/ui', async () => {
  const { createElement: create } = await import('react')
  return {
    CmsButton: ({
      children,
      loading,
      disabled,
      variant,
      size: _size,
      width: _width,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      loading?: boolean
      variant?: string
      size?: string
      width?: number
    }) =>
      create(
        'button',
        { ...props, disabled: disabled || loading, 'data-variant': variant },
        children
      ),
  }
})

vi.mock('@/shared/ui/cms-button', () => ({
  CMS_ACTION_BUTTON_WIDTH: 140,
}))

afterEach(cleanup)

const renderActions = (props: Partial<Parameters<typeof ProgramEditInfoActions>[0]> = {}) =>
  render(
    createElement(ProgramEditInfoActions, {
      isEditing: false,
      onEdit: vi.fn(),
      onCancel: vi.fn(),
      onSave: vi.fn(),
      ...props,
    })
  )

describe('ProgramEditInfoActions', () => {
  it('조회 상태에서 정보 수정 액션만 제공한다', () => {
    const onEdit = vi.fn()
    renderActions({ onEdit })

    fireEvent.click(screen.getByRole('button', { name: '정보 수정' }))

    expect(onEdit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '정보 수정' }).dataset.variant).toBe('primary')
  })

  it('편집 상태에서 같은 정보 수정 버튼으로 저장한다', () => {
    const onSave = vi.fn()
    renderActions({ isEditing: true, onSave })

    const button = screen.getByRole('button', { name: '정보 수정' })
    fireEvent.click(button)

    expect(onSave).toHaveBeenCalledOnce()
    expect(button.dataset.variant).toBe('secondary')
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull()
  })

  it('저장 중에는 중복 실행을 차단한다', () => {
    renderActions({ isEditing: true, saving: true })

    expect(screen.getByRole('button', { name: '정보 수정' }).hasAttribute('disabled')).toBe(true)
  })
})
