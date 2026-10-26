// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCategoryManagementModal } from './use-category-management-modal'
import type { CategoryRemoteActions } from './category-remote-actions'

function renderCategoryModal(onSave: CategoryRemoteActions['onSave']) {
  const onClose = vi.fn()
  const remoteActions: CategoryRemoteActions = {
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onSave,
  }
  const hook = renderHook(() =>
    useCategoryManagementModal({
      kind: 'notice',
      open: true,
      categories: [{ id: '1', name: '기존', updatedAt: '2026-10-25T06:00:00Z' }],
      onCategoriesChange: vi.fn(),
      posts: [],
      onClose,
      remoteActions,
    })
  )
  return { ...hook, onClose, remoteActions }
}

async function addDraftCategory(result: { current: ReturnType<typeof useCategoryManagementModal> }) {
  act(() => result.current.setNewDraft('신규'))
  act(() => result.current.submitNew())
}

describe('category management bulk-save interaction', () => {
  it('does not call the server before the final save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, onClose } = renderCategoryModal(onSave)

    await addDraftCategory(result)
    expect(onSave).not.toHaveBeenCalled()

    act(() => result.current.handleClose())
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sends the accumulated draft once and keeps it when the request fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('network'))
    const { result, onClose } = renderCategoryModal(onSave)

    await addDraftCategory(result)
    await act(async () => {
      await result.current.applySettings()
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0]?.[0].creates).toHaveLength(1)
    expect(result.current.draftCategories).toHaveLength(2)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ignores a second save while the first bulk request is pending', async () => {
    let resolveSave: (() => void) | undefined
    const pendingSave = new Promise<void>(resolve => {
      resolveSave = resolve
    })
    const onSave = vi.fn().mockReturnValue(pendingSave)
    const { result } = renderCategoryModal(onSave)

    await addDraftCategory(result)
    let firstSave: Promise<void> | undefined
    act(() => {
      firstSave = result.current.applySettings()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isSaving).toBe(true)
    await act(async () => {
      await result.current.applySettings()
    })
    expect(onSave).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave?.()
      await firstSave
    })
    expect(result.current.isSaving).toBe(false)
  })
})
