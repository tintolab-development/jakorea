/**
 * 카테고리 관리 모달 — 테이블 편집·삭제 플로우(불가/확인) 상태 및 핸들러
 * UI는 `NoticeCategoryManagementModal`에 두고, 비즈니스 분기만 훅으로 재사용 가능
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import { message } from 'antd'
import type { Notice } from '@/data/mock/notices'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

export type UseNoticeCategoryManagementModalParams = {
  open: boolean
  categories: NoticeCategoryRow[]
  onCategoriesChange: (next: NoticeCategoryRow[]) => void
  /** 삭제 가능 여부: 사용 중인 항목 수 (공지 목록 등) */
  notices: readonly Notice[]
  /** 메인 모달 닫기(상위) */
  onClose: () => void
}

export type UseNoticeCategoryManagementModalResult = {
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
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
  focusNewRow: () => void
}

export function useNoticeCategoryManagementModal({
  open,
  categories,
  onCategoriesChange,
  notices,
  onClose,
}: UseNoticeCategoryManagementModalParams): UseNoticeCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<NoticeCategoryRow | null>(null)
  const newInputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)

  const resetEphemeralUi = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
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
    if (trimmed === '') {
      message.warning('카테고리명을 입력해주세요.')
      return
    }
    if (hasDuplicateCategoryName(categories, trimmed, editingId)) {
      message.warning('이미 같은 이름의 카테고리가 있습니다.')
      return
    }
    onCategoriesChange(
      categories.map(c => (c.id === editingId ? { ...c, name: trimmed } : c))
    )
    message.success('카테고리가 수정되었습니다.')
    cancelEdit()
  }, [cancelEdit, categories, editDraft, editingId, onCategoriesChange])

  const removeCategory = useCallback(
    (id: string) => {
      onCategoriesChange(categories.filter(c => c.id !== id))
      if (editingId === id) cancelEdit()
      message.success('카테고리가 삭제되었습니다.')
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

  const confirmDeleteCategory = useCallback(() => {
    if (pendingDeleteRow == null) return
    removeCategory(pendingDeleteRow.id)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [pendingDeleteRow, removeCategory])

  const cancelNew = useCallback(() => {
    setNewDraft('')
  }, [])

  const submitNew = useCallback(() => {
    const trimmed = newDraft.trim()
    if (trimmed === '') {
      message.warning('카테고리명을 입력해주세요.')
      return
    }
    if (hasDuplicateCategoryName(categories, trimmed)) {
      message.warning('이미 같은 이름의 카테고리가 있습니다.')
      return
    }
    const id = createNoticeCategoryId()
    onCategoriesChange([...categories, { id, name: trimmed }])
    setNewDraft('')
    message.success('카테고리가 등록되었습니다.')
  }, [categories, newDraft, onCategoriesChange])

  const focusNewRow = useCallback(() => {
    newInputRef.current?.focus()
  }, [])

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
    focusNewRow,
  }
}
