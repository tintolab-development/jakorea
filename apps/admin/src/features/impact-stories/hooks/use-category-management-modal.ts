/**
 * 임팩트 스토리 카테고리 관리 — CMS 공지·FAQ·문의와 동일 초안·저장 플로우
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import type { ImpactStory, ImpactStoryCategory } from '@/entities/impact-stories/model/types'
import {
  countByCategoryId,
  createCategoryId,
  hasDuplicateCategoryName,
  hasImpactCategoryDraftChanges,
  IMPACT_CATEGORY_CONCURRENT_MODIFICATION_MESSAGE,
  IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE,
  IMPACT_CATEGORY_NAME_REQUIRED_MESSAGE,
  IMPACT_CATEGORY_SAVE_FAILURE_MESSAGE,
  validateImpactCategoryName,
} from '@/features/impact-stories/lib/category-domain'
import {
  isImpactCategoryConcurrentModificationError,
  isImpactCategoryDuplicateError,
  isImpactCategoryInUseError,
} from '@/features/impact-stories/lib/category-errors'
import { readApiErrorMessage } from '@/shared/lib/api-error-message'

function cloneCategories(rows: ImpactStoryCategory[]): ImpactStoryCategory[] {
  return rows.map(row => ({ ...row }))
}

export type UseCategoryManagementModalParams = {
  open: boolean
  categories: ImpactStoryCategory[]
  stories: readonly ImpactStory[]
  onClose: () => void
  onSave: (next: ImpactStoryCategory[]) => Promise<void> | void
}

export type UseCategoryManagementModalResult = {
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
  composeOpen: boolean
  deleteBlockedOpen: boolean
  duplicateAlertOpen: boolean
  deleteConfirmOpen: boolean
  settingsCompleteOpen: boolean
  saveErrorMessage: string | null
  isSaving: boolean
  draftCategories: ImpactStoryCategory[]
  pendingDeleteRow: ImpactStoryCategory | null
  closeDeleteBlocked: () => void
  closeDuplicateAlert: () => void
  closeSettingsComplete: () => void
  closeSaveError: () => void
  handleClose: () => void
  startEdit: (row: ImpactStoryCategory) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: ImpactStoryCategory) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  openCompose: () => void
  applySettings: () => Promise<void>
}

export function useCategoryManagementModal({
  open,
  categories,
  stories,
  onClose,
  onSave,
}: UseCategoryManagementModalParams): UseCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [settingsCompleteOpen, setSettingsCompleteOpen] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draftCategories, setDraftCategories] = useState<ImpactStoryCategory[]>(() =>
    cloneCategories(categories)
  )
  const baseCategoriesRef = useRef<ImpactStoryCategory[]>(cloneCategories(categories))
  const wasOpenRef = useRef(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ImpactStoryCategory | null>(null)
  const newInputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)

  const resetEphemeralUi = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    setComposeOpen(false)
    setDeleteBlockedOpen(false)
    setDuplicateAlertOpen(false)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
    setSaveErrorMessage(null)
  }, [])

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      baseCategoriesRef.current = cloneCategories(categories)
      setDraftCategories(cloneCategories(categories))
    }
    wasOpenRef.current = open
    if (!open) {
      resetEphemeralUi()
    }
  }, [categories, open, resetEphemeralUi])

  const handleClose = useCallback(() => {
    if (isSaving) return
    resetEphemeralUi()
    onClose()
  }, [isSaving, onClose, resetEphemeralUi])

  const startEdit = useCallback((row: ImpactStoryCategory) => {
    setComposeOpen(false)
    setNewDraft('')
    setEditingId(row.id)
    setEditDraft(row.name)
    queueMicrotask(() => editInputRef.current?.focus())
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
  }, [])

  const submitEdit = useCallback(() => {
    if (editingId == null) return
    const trimmed = editDraft.trim()
    const validation = validateImpactCategoryName(trimmed)
    if (validation === 'empty') {
      setSaveErrorMessage(IMPACT_CATEGORY_NAME_REQUIRED_MESSAGE)
      return
    }
    if (validation === 'invalid_characters') {
      setSaveErrorMessage(IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE)
      return
    }
    if (hasDuplicateCategoryName(draftCategories, trimmed, editingId)) {
      setDuplicateAlertOpen(true)
      return
    }
    setDraftCategories(rows => rows.map(c => (c.id === editingId ? { ...c, name: trimmed } : c)))
    cancelEdit()
  }, [cancelEdit, draftCategories, editDraft, editingId])

  const removeCategory = useCallback(
    (id: string) => {
      setDraftCategories(rows => rows.filter(c => c.id !== id))
      if (editingId === id) cancelEdit()
    },
    [cancelEdit, editingId]
  )

  const requestDeleteCategory = useCallback(
    (row: ImpactStoryCategory) => {
      const used =
        typeof row.storyCount === 'number'
          ? row.storyCount > 0
          : countByCategoryId(stories, s => s.categoryId, row.id) > 0
      if (used) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [stories]
  )

  const cancelDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [])

  const confirmDeleteCategory = useCallback(() => {
    if (pendingDeleteRow == null) return
    removeCategory(pendingDeleteRow.id)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [pendingDeleteRow, removeCategory])

  const cancelNew = useCallback(() => {
    setNewDraft('')
    setComposeOpen(false)
  }, [])

  const submitNew = useCallback(() => {
    const trimmed = newDraft.trim()
    const validation = validateImpactCategoryName(trimmed)
    if (validation === 'empty') {
      setSaveErrorMessage(IMPACT_CATEGORY_NAME_REQUIRED_MESSAGE)
      return
    }
    if (validation === 'invalid_characters') {
      setSaveErrorMessage(IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE)
      return
    }
    if (hasDuplicateCategoryName(draftCategories, trimmed)) {
      setDuplicateAlertOpen(true)
      return
    }
    const row: ImpactStoryCategory = {
      id: createCategoryId(),
      name: trimmed,
      sortOrder: draftCategories.length,
    }
    setDraftCategories(rows => [...rows, row])
    setNewDraft('')
    setComposeOpen(false)
  }, [draftCategories, newDraft])

  const openCompose = useCallback(() => {
    cancelEdit()
    setComposeOpen(true)
    queueMicrotask(() => newInputRef.current?.focus())
  }, [cancelEdit])

  const closeDeleteBlocked = useCallback(() => {
    setDeleteBlockedOpen(false)
  }, [])

  const closeDuplicateAlert = useCallback(() => {
    setDuplicateAlertOpen(false)
  }, [])

  const closeSaveError = useCallback(() => {
    setSaveErrorMessage(null)
  }, [])

  const applySettings = useCallback(async () => {
    if (isSaving) return
    const normalized = draftCategories.map((row, i) => ({
      ...row,
      name: row.name.trim(),
      sortOrder: i,
    }))
    if (!hasImpactCategoryDraftChanges(baseCategoriesRef.current, normalized)) {
      resetEphemeralUi()
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await onSave(normalized)
      baseCategoriesRef.current = cloneCategories(normalized)
      resetEphemeralUi()
      onClose()
      setSettingsCompleteOpen(true)
    } catch (error) {
      if (isImpactCategoryInUseError(error)) {
        setDeleteConfirmOpen(false)
        setPendingDeleteRow(null)
        setDeleteBlockedOpen(true)
      } else if (isImpactCategoryDuplicateError(error)) {
        setDuplicateAlertOpen(true)
      } else if (isImpactCategoryConcurrentModificationError(error)) {
        setSaveErrorMessage(
          readApiErrorMessage(error) ?? IMPACT_CATEGORY_CONCURRENT_MODIFICATION_MESSAGE
        )
      } else {
        setSaveErrorMessage(readApiErrorMessage(error) ?? IMPACT_CATEGORY_SAVE_FAILURE_MESSAGE)
      }
    } finally {
      setIsSaving(false)
    }
  }, [draftCategories, isSaving, onClose, onSave, resetEphemeralUi])

  const closeSettingsComplete = useCallback(() => {
    setSettingsCompleteOpen(false)
  }, [])

  return {
    newInputRef,
    editInputRef,
    editingId,
    editDraft,
    setEditDraft,
    newDraft,
    setNewDraft,
    composeOpen,
    deleteBlockedOpen,
    duplicateAlertOpen,
    deleteConfirmOpen,
    settingsCompleteOpen,
    saveErrorMessage,
    isSaving,
    draftCategories,
    pendingDeleteRow,
    closeDeleteBlocked,
    closeDuplicateAlert,
    closeSettingsComplete,
    closeSaveError,
    handleClose,
    startEdit,
    cancelEdit,
    submitEdit,
    requestDeleteCategory,
    cancelDeleteConfirm,
    confirmDeleteCategory,
    cancelNew,
    submitNew,
    openCompose,
    applySettings,
  }
}
