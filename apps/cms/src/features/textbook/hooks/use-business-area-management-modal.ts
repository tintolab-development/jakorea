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
import { invalidateBusinessAreaReferenceCaches } from '@/features/data-management/api/master-reference-cache'
import { planBusinessAreaSave, rebasePendingBusinessAreaDraft, type BusinessAreaSaveOperation } from '@/features/textbook/lib/business-area-save-plan'
import { hasDuplicateBusinessAreaName } from '@/features/textbook/lib/business-area-domain'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

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
  /** 화면에서 만든 변경사항을 저장할 때만 API에 반영 */
  applySettings: () => Promise<void>
}

const TEXTBOOK_BUSINESS_AREA_NAME_ALREADY_EXISTS = 'TEXTBOOK_BUSINESS_AREA_NAME_ALREADY_EXISTS'
const TEXTBOOK_BUSINESS_AREA_IN_USE = 'TEXTBOOK_BUSINESS_AREA_IN_USE'

function isConflictError(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 409
}

function isBusinessAreaDuplicateError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code === TEXTBOOK_BUSINESS_AREA_NAME_ALREADY_EXISTS || (isConflictError(error) && code !== TEXTBOOK_BUSINESS_AREA_IN_USE)
}

function isBusinessAreaInUseError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code === TEXTBOOK_BUSINESS_AREA_IN_USE || (isConflictError(error) && code !== TEXTBOOK_BUSINESS_AREA_NAME_ALREADY_EXISTS)
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
  const baselineRowsRef = useRef<TextbookBusinessAreaRow[]>([])
  const draftIdSequenceRef = useRef(0)
  const savingRef = useRef(false)
  const recoveryPendingRef = useRef<BusinessAreaSaveOperation[] | null>(null)
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

  // Fetch the canonical list before building a write plan. Cancel a stale in-flight GET.
  const fetchCanonicalRows = useCallback(async () => {
    const queryKey = dataManagementQueryKeys.textbooks.businessAreas()
    await queryClient.cancelQueries({ queryKey, exact: true })
    const next = await listTextbookBusinessAreas()
    queryClient.setQueryData(queryKey, next)
    return next
  }, [queryClient])

  const reloadRows = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchCanonicalRows()
      setRows(next)
      baselineRowsRef.current = next
      recoveryPendingRef.current = null
    } catch (error) {
      // A stale baseline must never be used to issue writes.
      recoveryPendingRef.current ??= []
      setSaveError(getDataManagementApiErrorMessage(error, '사업 분야 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [fetchCanonicalRows])

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
    setSaveError(null)
    setRows(prev => prev.map(row => (row.id === editingId ? { ...row, name: trimmed } : row)))
    cancelEdit()
  }, [cancelEdit, editDraft, editingId, rows])

  const requestDelete = useCallback(
    async (row: TextbookBusinessAreaRow) => {
      if (!row.deletable || row.textbookCount > 0) {
        setDeleteBlockedOpen(true)
        return
      }
      setSaveError(null)
      setRows(prev => prev.filter(item => item.id !== row.id))
      if (editingId === row.id) cancelEdit()
    },
    [cancelEdit, editingId]
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
    setSaveError(null)
    const draftId = `draft-business-area-${draftIdSequenceRef.current++}`
    setRows(prev => [
      ...prev,
      { id: draftId, name: trimmed, textbookCount: 0, deletable: true },
    ])
    setNewDraft('')
    setComposeOpen(false)
  }, [newDraft, rows])

  const openCompose = useCallback(() => {
    cancelEdit()
    setComposeOpen(true)
    queueMicrotask(() => newInputRef.current?.focus())
  }, [cancelEdit])

  const applySettings = useCallback(async () => {
    if (savingRef.current || loading) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    let pending = recoveryPendingRef.current ?? planBusinessAreaSave(baselineRowsRef.current, rows)
    let attempted = false
    try {
      if (recoveryPendingRef.current !== null) {
        // The preceding recovery GET failed. Reload/rebase first, without replaying writes.
        const canonical = await fetchCanonicalRows()
        baselineRowsRef.current = canonical
        setRows(rebasePendingBusinessAreaDraft(canonical, pending))
        recoveryPendingRef.current = null
        setSaveError('서버 최신 상태를 불러왔습니다. 남은 변경 사항을 확인한 후 다시 저장해 주세요.')
        return
      }
      if (pending.length > 0) {
        for (const op of [...pending]) {
          attempted = true
          if (op.kind === 'update') await updateTextbookBusinessArea(op.row.id, op.row.name)
          else if (op.kind === 'create') await createTextbookBusinessArea(op.row.name)
          else await deleteTextbookBusinessArea(op.row.id)
          pending = pending.slice(1)
        }
        const nextRows = await fetchCanonicalRows()
        baselineRowsRef.current = nextRows
        setRows(nextRows)
        await invalidateBusinessAreaReferenceCaches(queryClient)
        onSaved?.()
      }
      resetEphemeralUi()
      onClose()
      setSettingsCompleteOpen(true)
    } catch (error) {
      if (attempted) {
        // Writes are independent API calls, so even a failed response can leave committed changes.
        // Refresh dependent caches and reconcile the remaining draft against the server.
        recoveryPendingRef.current = pending
        await queryClient.invalidateQueries({
          queryKey: dataManagementQueryKeys.textbooks.businessAreas(),
          refetchType: 'none',
        })
        await invalidateBusinessAreaReferenceCaches(queryClient)
        try {
          const canonical = await fetchCanonicalRows()
          baselineRowsRef.current = canonical
          setRows(rebasePendingBusinessAreaDraft(canonical, pending))
          recoveryPendingRef.current = null
          setSaveError('일부 변경 사항이 이미 반영되었을 수 있습니다. 최신 상태와 남은 변경 사항을 확인해 주세요.')
        } catch {
          setSaveError('서버 최신 상태를 확인하지 못했습니다. 다시 저장을 누르면 목록을 먼저 불러옵니다.')
        }
      } else {
        setSaveError(getDataManagementApiErrorMessage(error, '사업 분야 설정 저장에 실패했습니다.'))
      }
      if (isBusinessAreaDuplicateError(error)) setDuplicateAlertOpen(true)
      if (isBusinessAreaInUseError(error)) setDeleteBlockedOpen(true)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [fetchCanonicalRows, loading, onClose, onSaved, queryClient, resetEphemeralUi, rows])

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
