/**
 * FAQ 카테고리 관리 모달 — 공지 `useNoticeCategoryManagementModal`과 동일 분기
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { FaqCategoryRemoteActions } from '@/features/posts/hooks/use-admin-faq-categories'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const FAQ_CATEGORY_IN_USE = 'FAQ_CATEGORY_IN_USE'
const FAQ_CATEGORY_NAME_ALREADY_EXISTS = 'FAQ_CATEGORY_NAME_ALREADY_EXISTS'

function isConflictStatus(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 409
}

function isFaqCategoryInUseError(error: unknown): boolean {
  return getApiErrorCode(error) === FAQ_CATEGORY_IN_USE || isConflictStatus(error)
}

function isFaqCategoryDuplicateError(error: unknown): boolean {
  return getApiErrorCode(error) === FAQ_CATEGORY_NAME_ALREADY_EXISTS || isConflictStatus(error)
}

export type UseFaqCategoryManagementModalParams = {
  open: boolean
  categories: FaqCategoryRow[]
  onCategoriesChange: (next: FaqCategoryRow[]) => void
  faqs: readonly AdminFaq[]
  onClose: () => void
  remoteActions?: FaqCategoryRemoteActions
}

export type UseFaqCategoryManagementModalResult = {
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
  pendingDeleteRow: FaqCategoryRow | null
  closeDeleteBlocked: () => void
  closeDuplicateAlert: () => void
  closeSettingsComplete: () => void
  handleClose: () => void
  startEdit: (row: FaqCategoryRow) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: FaqCategoryRow) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  openCompose: () => void
  applySettings: () => void
}

export function useFaqCategoryManagementModal({
  open,
  categories,
  onCategoriesChange,
  faqs,
  onClose,
  remoteActions,
}: UseFaqCategoryManagementModalParams): UseFaqCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [settingsCompleteOpen, setSettingsCompleteOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<FaqCategoryRow | null>(null)
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
  }, [])

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- props `open`과 로컬 UI 동기화
      resetEphemeralUi()
    }
  }, [open, resetEphemeralUi])

  const handleClose = useCallback(() => {
    resetEphemeralUi()
    onClose()
  }, [onClose, resetEphemeralUi])

  const startEdit = useCallback((row: FaqCategoryRow) => {
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

  const submitEdit = useCallback(async () => {
    if (editingId == null) return
    const trimmed = editDraft.trim()
    if (trimmed === '') {
      return
    }
    if (hasDuplicateCategoryName(categories, trimmed, editingId)) {
      setDuplicateAlertOpen(true)
      return
    }
    if (remoteActions) {
      try {
        await remoteActions.onUpdate(editingId, trimmed)
        cancelEdit()
      } catch (error) {
        if (isFaqCategoryDuplicateError(error)) {
          setDuplicateAlertOpen(true)
        }
      }
      return
    }
    onCategoriesChange(
      categories.map(c => (c.id === editingId ? { ...c, name: trimmed } : c))
    )
    cancelEdit()
  }, [cancelEdit, categories, editDraft, editingId, onCategoriesChange, remoteActions])

  const removeCategory = useCallback(
    (id: string) => {
      onCategoriesChange(categories.filter(c => c.id !== id))
      if (editingId === id) cancelEdit()
      },
    [cancelEdit, categories, editingId, onCategoriesChange]
  )

  const requestDeleteCategory = useCallback(
    (row: FaqCategoryRow) => {
      const used = countByCategoryLabel(faqs, f => f.category, row.name)
      if (used > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [faqs]
  )

  const cancelDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [])

  const confirmDeleteCategory = useCallback(async () => {
    if (pendingDeleteRow == null) return
    if (remoteActions) {
      try {
        await remoteActions.onDelete(pendingDeleteRow.id)
        setDeleteConfirmOpen(false)
        setPendingDeleteRow(null)
      } catch (error) {
        if (isFaqCategoryInUseError(error)) {
          setDeleteConfirmOpen(false)
          setPendingDeleteRow(null)
          setDeleteBlockedOpen(true)
        }
      }
      return
    }
    removeCategory(pendingDeleteRow.id)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [pendingDeleteRow, remoteActions, removeCategory])

  const cancelNew = useCallback(() => {
    setNewDraft('')
    setComposeOpen(false)
  }, [])

  const submitNew = useCallback(async () => {
    const trimmed = newDraft.trim()
    if (trimmed === '') {
      return
    }
    if (hasDuplicateCategoryName(categories, trimmed)) {
      setDuplicateAlertOpen(true)
      return
    }
    if (remoteActions) {
      try {
        await remoteActions.onCreate(trimmed)
        setNewDraft('')
        setComposeOpen(false)
      } catch (error) {
        if (isFaqCategoryDuplicateError(error)) {
          setDuplicateAlertOpen(true)
        }
      }
      return
    }
    const id = createNoticeCategoryId()
    onCategoriesChange([...categories, { id, name: trimmed }])
    setNewDraft('')
    setComposeOpen(false)
  }, [categories, newDraft, onCategoriesChange, remoteActions])

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

  const applySettings = useCallback(() => {
    resetEphemeralUi()
    onClose()
    setSettingsCompleteOpen(true)
  }, [onClose, resetEphemeralUi])

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
    pendingDeleteRow,
    closeDeleteBlocked,
    closeDuplicateAlert,
    closeSettingsComplete,
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
