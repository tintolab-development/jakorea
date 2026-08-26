/**
 * 카테고리 관리 모달 — 테이블 편집·삭제 플로우(불가/확인) 상태 및 핸들러
 * UI는 `NoticeCategoryManagementModal`에 두고, 비즈니스 분기만 훅으로 재사용 가능
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import type { Notice } from '@/data/mock/notices'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { NoticeCategoryRemoteActions } from '@/features/posts/hooks/use-admin-notice-categories'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

export type UseNoticeCategoryManagementModalParams = {
  open: boolean
  categories: NoticeCategoryRow[]
  onCategoriesChange: (next: NoticeCategoryRow[]) => void
  /** 삭제 가능 여부: 사용 중인 항목 수 (공지 목록 등) */
  notices: readonly Notice[]
  /** 메인 모달 닫기(상위) */
  onClose: () => void
  remoteActions?: NoticeCategoryRemoteActions
}

export type UseNoticeCategoryManagementModalResult = {
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
  composeOpen: boolean
  deleteBlockedOpen: boolean
  deleteConfirmOpen: boolean
  pendingDeleteRow: NoticeCategoryRow | null
  closeDeleteBlocked: () => void
  handleClose: () => void
  startEdit: (row: NoticeCategoryRow) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: NoticeCategoryRow) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  openCompose: () => void
}

export function useNoticeCategoryManagementModal({
  open,
  categories,
  onCategoriesChange,
  notices,
  onClose,
  remoteActions,
}: UseNoticeCategoryManagementModalParams): UseNoticeCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<NoticeCategoryRow | null>(null)
  const newInputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)

  const resetEphemeralUi = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    setComposeOpen(false)
    setDeleteBlockedOpen(false)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [])

  // 상위가 `open`만 false로 두고 `onClose`를 타지 않는 경우에도 편집/삭제 오버레이 상태를 비움
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

  const startEdit = useCallback((row: NoticeCategoryRow) => {
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
      return
    }
    if (remoteActions) {
      await remoteActions.onUpdate(editingId, trimmed)
      cancelEdit()
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
    (row: NoticeCategoryRow) => {
      const used = countByCategoryLabel(notices, n => n.category, row.name)
      if (used > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [notices]
  )

  const cancelDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [])

  const confirmDeleteCategory = useCallback(async () => {
    if (pendingDeleteRow == null) return
    if (remoteActions) {
      await remoteActions.onDelete(pendingDeleteRow.id)
      setDeleteConfirmOpen(false)
      setPendingDeleteRow(null)
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
      return
    }
    if (remoteActions) {
      await remoteActions.onCreate(trimmed)
      setNewDraft('')
      setComposeOpen(false)
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
    deleteConfirmOpen,
    pendingDeleteRow,
    closeDeleteBlocked,
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
  }
}
