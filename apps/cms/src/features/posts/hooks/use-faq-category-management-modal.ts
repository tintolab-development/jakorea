/**
 * FAQ 카테고리 관리 모달 — 공지 `useNoticeCategoryManagementModal`과 동일 분기
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import { message } from 'antd'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import {
  countByCategoryLabel,
  createNoticeCategoryId,
  hasDuplicateCategoryName,
} from '@/features/posts/model/notice-category-domain'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'

export type UseFaqCategoryManagementModalParams = {
  open: boolean
  categories: FaqCategoryRow[]
  onCategoriesChange: (next: FaqCategoryRow[]) => void
  faqs: readonly AdminFaq[]
  onClose: () => void
}

export type UseFaqCategoryManagementModalResult = {
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
  deleteBlockedOpen: boolean
  deleteConfirmOpen: boolean
  pendingDeleteRow: FaqCategoryRow | null
  closeDeleteBlocked: () => void
  handleClose: () => void
  startEdit: (row: FaqCategoryRow) => void
  cancelEdit: () => void
  submitEdit: () => void
  requestDeleteCategory: (row: FaqCategoryRow) => void
  cancelDeleteConfirm: () => void
  confirmDeleteCategory: () => void
  cancelNew: () => void
  submitNew: () => void
  focusNewRow: () => void
}

export function useFaqCategoryManagementModal({
  open,
  categories,
  onCategoriesChange,
  faqs,
  onClose,
}: UseFaqCategoryManagementModalParams): UseFaqCategoryManagementModalResult {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<FaqCategoryRow | null>(null)
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

  const startEdit = useCallback((row: FaqCategoryRow) => {
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
