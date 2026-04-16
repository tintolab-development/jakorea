/**
 * 문의 카테고리 관리 모달 — 공지용 훅과 동일 플로우, 문의 목록으로 사용 여부 판단
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import { message } from 'antd'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'
import type { AdminInquiryRow } from '@/features/posts/model/admin-inquiry-management.types'

export type UseInquiryCategoryManagementModalParams = {
  open: boolean
  categories: InquiryCategoryRow[]
  onCategoriesChange: (next: InquiryCategoryRow[]) => void
  inquiries: readonly AdminInquiryRow[]
  onClose: () => void
}

export type UseInquiryCategoryManagementModalResult = {
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
  deleteBlockedOpen: boolean
  deleteConfirmOpen: boolean
  pendingDeleteRow: InquiryCategoryRow | null
  closeDeleteBlocked: () => void
  handleClose: () => void
  startEdit: (row: InquiryCategoryRow) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: InquiryCategoryRow) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  focusNewRow: () => void
}

export function useInquiryCategoryManagementModal({
  open,
  categories,
  onCategoriesChange,
  inquiries,
  onClose,
}: UseInquiryCategoryManagementModalParams): UseInquiryCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<InquiryCategoryRow | null>(null)
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

  const startEdit = useCallback((row: InquiryCategoryRow) => {
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
    (row: InquiryCategoryRow) => {
      const used = countByCategoryLabel(inquiries, i => i.category, row.name)
      if (used > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setPendingDeleteRow(row)
      setDeleteConfirmOpen(true)
    },
    [inquiries]
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
