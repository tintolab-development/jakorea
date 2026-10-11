/**
 * 카테고리 관리 모달 — 공지·FAQ·문의 공통 편집·삭제 플로우
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'
import {
  isCategoryDuplicateError,
  isCategoryInUseError,
  type CategoryManagementKind,
  type PostWithCategoryLabel,
  getPostCategoryLabel,
} from '@/features/posts/model/category-management-config'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { PostsCategoryRow } from '@/features/posts/model/posts-category-row'

export type UseCategoryManagementModalParams = {
  kind: CategoryManagementKind
  open: boolean
  categories: PostsCategoryRow[]
  onCategoriesChange: (next: PostsCategoryRow[]) => void
  posts: readonly PostWithCategoryLabel[]
  onClose: () => void
  remoteActions?: CategoryRemoteActions
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
  pendingDeleteRow: PostsCategoryRow | null
  closeDeleteBlocked: () => void
  closeDuplicateAlert: () => void
  closeSettingsComplete: () => void
  handleClose: () => void
  startEdit: (row: PostsCategoryRow) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: PostsCategoryRow) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  openCompose: () => void
  applySettings: () => void
}

export function useCategoryManagementModal({
  kind,
  open,
  categories,
  onCategoriesChange,
  posts,
  onClose,
  remoteActions,
}: UseCategoryManagementModalParams): UseCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [settingsCompleteOpen, setSettingsCompleteOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<PostsCategoryRow | null>(null)
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

  const startEdit = useCallback((row: PostsCategoryRow) => {
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
        if (isCategoryDuplicateError(error, kind)) {
          setDuplicateAlertOpen(true)
        }
      }
      return
    }
    onCategoriesChange(
      categories.map(c => (c.id === editingId ? { ...c, name: trimmed } : c))
    )
    cancelEdit()
  }, [cancelEdit, categories, editDraft, editingId, kind, onCategoriesChange, remoteActions])

  const removeCategory = useCallback(
    (id: string) => {
      onCategoriesChange(categories.filter(c => c.id !== id))
      if (editingId === id) cancelEdit()
    },
    [cancelEdit, categories, editingId, onCategoriesChange]
  )

  const requestDeleteCategory = useCallback(
    (row: PostsCategoryRow) => {
      const used = countByCategoryLabel(
        posts,
        post => getPostCategoryLabel(post) ?? '',
        row.name
      )
      if (used > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [posts]
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
        if (isCategoryInUseError(error, kind)) {
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
  }, [kind, pendingDeleteRow, remoteActions, removeCategory])

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
        if (isCategoryDuplicateError(error, kind)) {
          setDuplicateAlertOpen(true)
        }
      }
      return
    }
    const id = createNoticeCategoryId()
    onCategoriesChange([...categories, { id, name: trimmed }])
    setNewDraft('')
    setComposeOpen(false)
  }, [categories, kind, newDraft, onCategoriesChange, remoteActions])

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
