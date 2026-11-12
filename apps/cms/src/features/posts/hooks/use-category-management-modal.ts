/**
 * 카테고리 관리 모달 — 공지·FAQ·문의 공통 편집·삭제 플로우
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import {
  isCategoryDuplicateError,
  isCategoryInUseError,
  isCategoryConcurrentModificationError,
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
import {
  buildCategoryManagementDraftChanges,
  CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE,
  CATEGORY_NAME_REQUIRED_MESSAGE,
  hasCategoryManagementDraftChanges,
  validateCategoryName,
  categoryNameFieldError,
} from '@/features/posts/model/category-management-draft'

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
  /** 수정 입력칸 에러 (등록 시 검증 실패) */
  editNameError: string | null
  newDraft: string
  setNewDraft: (v: string) => void
  /** 새 항목 입력칸 에러 (등록 시 검증 실패) */
  newNameError: string | null
  composeOpen: boolean
  deleteBlockedOpen: boolean
  duplicateAlertOpen: boolean
  deleteConfirmOpen: boolean
  settingsCompleteOpen: boolean
  saveErrorMessage: string | null
  isSaving: boolean
  draftCategories: PostsCategoryRow[]
  pendingDeleteRow: PostsCategoryRow | null
  closeDeleteBlocked: () => void
  closeDuplicateAlert: () => void
  closeSettingsComplete: () => void
  closeSaveError: () => void
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
  applySettings: () => Promise<void>
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
  const [editDraft, setEditDraftState] = useState('')
  const [newDraft, setNewDraftState] = useState('')
  /** QA-0272 — 등록 시 이름 검증 실패를 입력칸 에러로도 표시 (입력하면 해제) */
  const [editNameError, setEditNameError] = useState<string | null>(null)
  const [newNameError, setNewNameError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [settingsCompleteOpen, setSettingsCompleteOpen] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draftCategories, setDraftCategories] = useState<PostsCategoryRow[]>(categories)
  const baseCategoriesRef = useRef<PostsCategoryRow[]>(categories)
  const wasOpenRef = useRef(false)
  const [pendingDeleteRow, setPendingDeleteRow] = useState<PostsCategoryRow | null>(null)
  const newInputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)

  const setEditDraft = useCallback((value: string) => {
    setEditDraftState(value)
    setEditNameError(null)
  }, [])

  const setNewDraft = useCallback((value: string) => {
    setNewDraftState(value)
    setNewNameError(null)
  }, [])

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
  }, [setEditDraft, setNewDraft])

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      baseCategoriesRef.current = categories.map(row => ({ ...row }))
      setDraftCategories(categories.map(row => ({ ...row })))
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

  const startEdit = useCallback((row: PostsCategoryRow) => {
    setComposeOpen(false)
    setNewDraft('')
    setEditingId(row.id)
    setEditDraft(row.name)
    queueMicrotask(() => editInputRef.current?.focus())
  }, [setEditDraft, setNewDraft])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
  }, [setEditDraft])

  const submitEdit = useCallback(() => {
    if (editingId == null) return
    const trimmed = editDraft.trim()
    const validation = validateCategoryName(trimmed)
    setEditNameError(categoryNameFieldError(trimmed))
    if (validation === 'empty') {
      setSaveErrorMessage(CATEGORY_NAME_REQUIRED_MESSAGE)
      return
    }
    if (validation === 'invalid_characters') {
      setSaveErrorMessage(CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE)
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
    removeCategory(pendingDeleteRow.id)
    setDeleteConfirmOpen(false)
    setPendingDeleteRow(null)
  }, [pendingDeleteRow, removeCategory])

  const cancelNew = useCallback(() => {
    setNewDraft('')
    setComposeOpen(false)
  }, [setNewDraft])

  const submitNew = useCallback(() => {
    const trimmed = newDraft.trim()
    const validation = validateCategoryName(trimmed)
    setNewNameError(categoryNameFieldError(trimmed))
    if (validation === 'empty') {
      setSaveErrorMessage(CATEGORY_NAME_REQUIRED_MESSAGE)
      return
    }
    if (validation === 'invalid_characters') {
      setSaveErrorMessage(CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE)
      return
    }
    if (hasDuplicateCategoryName(draftCategories, trimmed)) {
      setDuplicateAlertOpen(true)
      return
    }
    const id = createNoticeCategoryId()
    setDraftCategories(rows => [...rows, { id, name: trimmed }])
    setNewDraft('')
    setComposeOpen(false)
  }, [draftCategories, newDraft, setNewDraft])

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
    const changes = buildCategoryManagementDraftChanges(baseCategoriesRef.current, draftCategories)
    if (!hasCategoryManagementDraftChanges(changes)) {
      resetEphemeralUi()
      onClose()
      return
    }

    if (remoteActions?.onSave == null) {
      if (remoteActions == null) {
        onCategoriesChange(draftCategories)
        resetEphemeralUi()
        onClose()
        setSettingsCompleteOpen(true)
        return
      }
      setSaveErrorMessage('카테고리 일괄 저장 API가 아직 연결되지 않았습니다.')
      return
    }

    setIsSaving(true)
    try {
      await remoteActions.onSave(changes)
      baseCategoriesRef.current = draftCategories.map(row => ({ ...row }))
      resetEphemeralUi()
      onClose()
      setSettingsCompleteOpen(true)
    } catch (error) {
      if (isCategoryInUseError(error, kind)) {
        setDeleteConfirmOpen(false)
        setPendingDeleteRow(null)
        setDeleteBlockedOpen(true)
      } else if (isCategoryDuplicateError(error, kind)) {
        setDuplicateAlertOpen(true)
      } else if (isCategoryConcurrentModificationError(error, kind)) {
        setSaveErrorMessage(
          getPostsApiErrorMessage(
            error,
            '다른 관리자가 카테고리를 먼저 변경했습니다. 최신 목록을 확인한 후 다시 저장해 주세요.'
          )
        )
      } else {
        setSaveErrorMessage(
          getPostsApiErrorMessage(error, '카테고리 설정을 저장하지 못했습니다. 변경 내용을 확인해 주세요.')
        )
      }
    } finally {
      setIsSaving(false)
    }
  }, [
    draftCategories,
    isSaving,
    kind,
    onCategoriesChange,
    onClose,
    remoteActions,
    resetEphemeralUi,
  ])

  const closeSettingsComplete = useCallback(() => {
    setSettingsCompleteOpen(false)
  }, [])

  return {
    newInputRef,
    editInputRef,
    editingId,
    editDraft,
    setEditDraft,
    editNameError,
    newDraft,
    setNewDraft,
    newNameError,
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
