/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isTemplateDetailUrlMode,
  isTemplateDetailViewUrlMode,
} from '@/features/template/lib/detail-url-mode'
import { TemplateDetailViewModeProvider } from './detail-view-mode-context'
import { TemplateFullpageModal } from './template-fullpage-modal'

function renderModal(templateTabType: 'writing' | 'issuance') {
  return (
    <TemplateFullpageModal
      open
      onClose={() => undefined}
      title="양식"
      templateTabType={templateTabType}
      onSave={() => undefined}
      showDeleteButton
      onDelete={() => undefined}
      leftContent={<input aria-label="본문 입력" />}
      rightNavigation={<div>오른쪽</div>}
    />
  )
}

describe('template detail URL mode', () => {
  it('opens the detail modal for view and edit, and only view is read-only', () => {
    expect(isTemplateDetailUrlMode('view')).toBe(true)
    expect(isTemplateDetailUrlMode('edit')).toBe(true)
    expect(isTemplateDetailUrlMode('new')).toBe(false)
    expect(isTemplateDetailUrlMode(undefined)).toBe(false)
    expect(isTemplateDetailViewUrlMode('view')).toBe(true)
    expect(isTemplateDetailViewUrlMode('edit')).toBe(false)
  })
})

describe('TemplateFullpageModal detail view mode', () => {
  afterEach(() => {
    cleanup()
  })

  it('hides save/delete, locks the body and shows 수정 in view mode', () => {
    const onRequestEdit = vi.fn()
    render(
      <TemplateDetailViewModeProvider readOnly onRequestEdit={onRequestEdit}>
        {renderModal('writing')}
      </TemplateDetailViewModeProvider>
    )
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull()
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    expect(document.querySelector('.full-page-modal__left')?.hasAttribute('inert')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(onRequestEdit).toHaveBeenCalledTimes(1)
  })

  it('shows 수정 instead of 저장 on the issuance header too', () => {
    render(
      <TemplateDetailViewModeProvider readOnly onRequestEdit={() => undefined}>
        {renderModal('issuance')}
      </TemplateDetailViewModeProvider>
    )
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull()
    expect(screen.getByRole('button', { name: '수정' })).toBeTruthy()
  })

  it('keeps the existing edit UI without the provider (program registration etc.)', () => {
    render(renderModal('writing'))
    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull()
    expect(document.querySelector('.full-page-modal__left')?.hasAttribute('inert')).toBe(false)
  })
})
