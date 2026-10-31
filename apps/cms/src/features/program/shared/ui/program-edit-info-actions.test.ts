// @vitest-environment jsdom

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProgramEditInfoActions } from './program-edit-info-actions'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_CANCEL_LABEL,
  PROGRAM_EDIT_INFO_SAVE_LABEL,
} from '@/features/program/shared/lib/program-edit-info-button'

vi.mock('@/shared/ui', async () => {
  const { createElement: create } = await import('react')
  const Button = ({
    children,
    loading,
    disabled,
    variant,
    size: _size,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    variant?: string
    size?: string
  }) =>
    create(
      'button',
      { ...props, disabled: disabled || loading, 'data-variant': variant },
      children
    )
  return {
    CmsButton: Button,
    FilterTableToolbarButton: Button,
  }
})

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
  it('조회 모드에서 정보 수정 버튼만 노출한다', () => {
    renderActions()

    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL })).toBeTruthy()
    expect(screen.queryByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL })).toBeNull()
    expect(screen.queryByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL })).toBeNull()
    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL }).dataset.variant).toBe(
      'secondary'
    )
  })

  it('정보 수정 클릭 시 onEdit을 호출한다', () => {
    const onEdit = vi.fn()
    renderActions({ onEdit })

    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL }))

    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('수정 모드에서는 취소/저장 두 버튼만 노출한다', () => {
    renderActions({ isEditing: true })

    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL })).toBeTruthy()
    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL })).toBeTruthy()
    expect(screen.queryByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL })).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL }).dataset.variant).toBe(
      'secondary'
    )
    expect(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL }).dataset.variant).toBe(
      'primary'
    )
  })

  it('취소 클릭 시 onCancel을 호출한다', () => {
    const onCancel = vi.fn()
    renderActions({ isEditing: true, onCancel })

    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('저장 클릭 시 onSave를 호출한다', () => {
    const onSave = vi.fn()
    renderActions({ isEditing: true, onSave })

    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL }))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('저장 중에는 저장 버튼을 비활성화해 중복 요청을 막는다', () => {
    const onSave = vi.fn()
    renderActions({ isEditing: true, saving: true, onSave })

    const saveButton = screen.getByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL })
    expect(saveButton.hasAttribute('disabled')).toBe(true)
    fireEvent.click(saveButton)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('저장 중에는 취소 버튼을 비활성화한다', () => {
    const onCancel = vi.fn()
    renderActions({ isEditing: true, saving: true, onCancel })

    const cancelButton = screen.getByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL })
    expect(cancelButton.hasAttribute('disabled')).toBe(true)
    fireEvent.click(cancelButton)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('툴바 버튼 모드에서도 조회/수정 전환이 동일하다', () => {
    const onEdit = vi.fn()
    const onCancel = vi.fn()
    const onSave = vi.fn()
    const { rerender } = renderActions({ useToolbarButton: true, onEdit, onCancel, onSave })

    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL }))
    expect(onEdit).toHaveBeenCalledOnce()

    rerender(
      createElement(ProgramEditInfoActions, {
        isEditing: true,
        useToolbarButton: true,
        onEdit,
        onCancel,
        onSave,
      })
    )

    expect(screen.queryByRole('button', { name: PROGRAM_EDIT_INFO_BUTTON_LABEL })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_CANCEL_LABEL }))
    fireEvent.click(screen.getByRole('button', { name: PROGRAM_EDIT_INFO_SAVE_LABEL }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledOnce()
  })
})
