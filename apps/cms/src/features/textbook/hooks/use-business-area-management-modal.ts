import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import {
  createTextbookBusinessArea,
  deleteTextbookBusinessArea,
  listTextbookBusinessAreas,
  updateTextbookBusinessArea,
} from '@/features/textbook/api/admin-business-areas-service'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { hasDuplicateBusinessAreaName } from '@/features/textbook/lib/business-area-domain'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'

export type UseBusinessAreaManagementModalParams = {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

export type UseBusinessAreaManagementModalResult = {
  rows: TextbookBusinessAreaRow[]
  loading: boolean
  newInputRef: RefObject<InputRef | null>
  editInputRef: RefObject<InputRef | null>
  editingId: string | null
  editDraft: string
  setEditDraft: (v: string) => void
  newDraft: string
  setNewDraft: (v: string) => void
  composeOpen: boolean
  saving: boolean
  saveError: string | null
  deleteBlockedOpen: boolean
  duplicateAlertOpen: boolean
  settingsCompleteOpen: boolean
  closeDeleteBlocked: () => void
  closeDuplicateAlert: () => void
  closeSettingsComplete: () => void
  handleClose: () => void
  startEdit: (row: TextbookBusinessAreaRow) => void
  cancelEdit: () => void
  submitEdit: () => Promise<void>
  requestDelete: (row: TextbookBusinessAreaRow) => Promise<void>
  cancelNew: () => void
  submitNew: () => Promise<void>
  openCompose: () => void
  /** Notion: FE 확인 팝업만 (API 없음) */
  applySettings: () => void
}

function isConflictError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 409
  )
}

export function useBusinessAreaManagementModal({
  open,
  onClose,
  onSaved,
}: UseBusinessAreaManagementModalParams): UseBusinessAreaManagementModalResult {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<TextbookBusinessAreaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [newDraft, setNewDraft] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [settingsCompleteOpen, setSettingsCompleteOpen] = useState(false)
  const newInputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)

  const resetEphemeralUi = useCallback(() => {
    setEditingId(null)
    setEditDraft('')
    setNewDraft('')
    setComposeOpen(false)
    setSaveError(null)
    setDeleteBlockedOpen(false)
    setDuplicateAlertOpen(false)
  }, [])

  /** 로컬 rows를 RQ 캐시에 반영 — invalidate로 BA GET을 다시 치지 않음 */
  const syncBusinessAreasCache = useCallback(
    (nextRows: TextbookBusinessAreaRow[]) => {
      queryClient.setQueryData(dataManagementQueryKeys.textbooks.businessAreas(), nextRows)
    },
    [queryClient]
  )

  /** 사업 분야명 변경 시에만 교재 목록 refetch (목록에 문자열로 노출) */
  const invalidateTextbookLists = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.textbooks.lists(),
    })
  }, [queryClient])

  const reloadRows = useCallback(async () => {
    const cached = queryClient.getQueryData<TextbookBusinessAreaRow[]>(
      dataManagementQueryKeys.textbooks.businessAreas()
    )
    if (cached !== undefined) {
      setRows(cached)
      return
    }
    setLoading(true)
    try {
      const next = await listTextbookBusinessAreas()
      setRows(next)
      queryClient.setQueryData(dataManagementQueryKeys.textbooks.businessAreas(), next)
    } catch (error) {
      setSaveError(
        getDataManagementApiErrorMessage(error, '사업 분야 목록을 불러오지 못했습니다.')
      )
    } finally {
      setLoading(false)
    }
  }, [queryClient])

  useEffect(() => {
    if (!open) {
      resetEphemeralUi()
      return
    }
    resetEphemeralUi()
    void reloadRows()
  }, [open, resetEphemeralUi, reloadRows])

  const handleClose = useCallback(() => {
    resetEphemeralUi()
    onClose()
  }, [onClose, resetEphemeralUi])

  const startEdit = useCallback((row: TextbookBusinessAreaRow) => {
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
    if (!trimmed) return
    if (hasDuplicateBusinessAreaName(rows, trimmed, editingId)) {
      setDuplicateAlertOpen(true)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateTextbookBusinessArea(editingId, trimmed)
      setRows(prev => {
        const next = prev.map(row => (row.id === editingId ? updated : row))
        syncBusinessAreasCache(next)
        return next
      })
      cancelEdit()
      await invalidateTextbookLists()
      onSaved?.()
    } catch (error) {
      if (isConflictError(error)) {
        setDuplicateAlertOpen(true)
        return
      }
      setSaveError(getDataManagementApiErrorMessage(error, '사업 분야 수정에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }, [cancelEdit, editDraft, editingId, invalidateTextbookLists, onSaved, rows, syncBusinessAreasCache])

  const requestDelete = useCallback(
    async (row: TextbookBusinessAreaRow) => {
      if (!row.deletable || row.textbookCount > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setSaving(true)
      setSaveError(null)
      try {
        await deleteTextbookBusinessArea(row.id)
        setRows(prev => {
          const next = prev.filter(item => item.id !== row.id)
          syncBusinessAreasCache(next)
          return next
        })
        if (editingId === row.id) cancelEdit()
        onSaved?.()
      } catch (error) {
        if (isConflictError(error)) {
          setDeleteBlockedOpen(true)
          return
        }
        setSaveError(getDataManagementApiErrorMessage(error, '사업 분야 삭제에 실패했습니다.'))
      } finally {
        setSaving(false)
      }
    },
    [cancelEdit, editingId, onSaved, syncBusinessAreasCache]
  )

  const cancelNew = useCallback(() => {
    setNewDraft('')
    setComposeOpen(false)
  }, [])

  const submitNew = useCallback(async () => {
    const trimmed = newDraft.trim()
    if (!trimmed) return
    if (hasDuplicateBusinessAreaName(rows, trimmed)) {
      setDuplicateAlertOpen(true)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const created = await createTextbookBusinessArea(trimmed)
      setRows(prev => {
        const next = [...prev, created]
        syncBusinessAreasCache(next)
        return next
      })
      setNewDraft('')
      setComposeOpen(false)
      onSaved?.()
    } catch (error) {
      if (isConflictError(error)) {
        setDuplicateAlertOpen(true)
        return
      }
      setSaveError(getDataManagementApiErrorMessage(error, '사업 분야 등록에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }, [newDraft, onSaved, rows, syncBusinessAreasCache])

  const openCompose = useCallback(() => {
    cancelEdit()
    setComposeOpen(true)
    queueMicrotask(() => newInputRef.current?.focus())
  }, [cancelEdit])

  const applySettings = useCallback(() => {
    resetEphemeralUi()
    onClose()
    setSettingsCompleteOpen(true)
  }, [onClose, resetEphemeralUi])

  return {
    rows,
    loading,
    newInputRef,
    editInputRef,
    editingId,
    editDraft,
    setEditDraft,
    newDraft,
    setNewDraft,
    composeOpen,
    saving,
    saveError,
    deleteBlockedOpen,
    duplicateAlertOpen,
    settingsCompleteOpen,
    closeDeleteBlocked: () => setDeleteBlockedOpen(false),
    closeDuplicateAlert: () => setDuplicateAlertOpen(false),
    closeSettingsComplete: () => setSettingsCompleteOpen(false),
    handleClose,
    startEdit,
    cancelEdit,
    submitEdit,
    requestDelete,
    cancelNew,
    submitNew,
    openCompose,
    applySettings,
  }
}
