import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import { isDataManagementListLoading } from '@/features/data-management/lib/is-list-query-loading'
import { useDetailedProgramListQuery } from '@/features/detailed-program/hooks/use-detailed-program-list-query'
import { useDetailedProgramMutations } from '@/features/detailed-program/hooks/use-detailed-program-mutations'
import { useUnsavedLeaveGuard } from '@/features/detailed-program/hooks/use-unsaved-leave-guard'
import {
  DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT,
  DETAILED_PROGRAM_CONCURRENT_MODIFICATION_TITLE,
  detailedProgramFieldErrorMessage,
  getDetailedProgramApiErrorMessage,
  getDetailedProgramErrorRowId,
  isDetailedProgramConcurrentModificationError,
} from '@/features/detailed-program/lib/api-errors'
import { DETAILED_PROGRAM_BULK_MAX } from '@/features/detailed-program/lib/bulk-update'
import { DETAILED_PROGRAM_DELETE_BLOCKED_REASON } from '@/features/detailed-program/lib/detailed-program-delete-blocked-copy'
import { hasUnsavedDetailedProgramEdits } from '@/features/detailed-program/lib/edit-dirty'
import { isDetailedProgramInUseDeleteError } from '@/features/detailed-program/lib/is-detailed-program-in-use-delete-error'
import { resolveDetailedProgramSaveCall } from '@/features/detailed-program/lib/save-call'
import {
  detailedProgramBulkMaxMessage,
  planDetailedProgramSave,
} from '@/features/detailed-program/lib/validate-edits'
import { resolveDeleteBlockedGuideCopy } from '@/shared/lib/delete-blocked-guide-copy'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { buildBulkDeleteGuideTitle } from '@/shared/ui/delete-guide-messages'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { detailedProgramManagementFilterFields } from '@/features/detailed-program/model/detailed-program-management-filter-fields'
import { detailedProgramManagementTablePageConfig } from '@/features/detailed-program/model/detailed-program-management-table.config'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type {
  DetailedProgramDraft,
  DetailedProgramManagementRow,
} from '@/features/detailed-program/model/detailed-program-management.types'
import { DetailedProgramAddItemModal } from '@/features/detailed-program/ui/detailed-program-add-item-modal'
import type { DetailedProgramAddItemValues } from '@/features/detailed-program/ui/detailed-program-add-item-modal'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  DeleteGuideModal,
  cmsAlertModal,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './detailed-program-page.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

const USAGE_RADIO_OPTIONS = [
  { label: '사용', value: true },
  { label: '미사용', value: false },
] as const

const DETAILED_PROGRAM_DELETE_GUIDE_TITLE = '세부 프로그램 삭제 안내'

const DETAILED_PROGRAM_DELETE_GUIDE_LINES_SINGLE = [
  '해당 세부 프로그램을 삭제하시겠습니까?',
  '삭제된 정보는 되돌릴 수 없습니다.',
] as const

function detailedProgramDeleteGuideTitle(selectedCount: number): string {
  return selectedCount >= 2
    ? buildBulkDeleteGuideTitle('세부 프로그램')
    : DETAILED_PROGRAM_DELETE_GUIDE_TITLE
}

function detailedProgramDeleteGuideLines(selectedCount: number): string[] {
  if (selectedCount <= 1) return [...DETAILED_PROGRAM_DELETE_GUIDE_LINES_SINGLE]
  return [
    `**선택한 ${selectedCount}개의 세부 프로그램**을 삭제하시겠습니까?`,
    DETAILED_PROGRAM_DELETE_GUIDE_LINES_SINGLE[1],
  ]
}

/** 사용 여부 열 — 시안 240px (수정 모드 라디오 2개 가로 배치) */
const USAGE_COL_WIDTH = 240
const USAGE_COL_CLASS = 'detailed-program-page__usage-col'
/** 등록자명 / 등록일시 — 시안 고정 폭 */
const REGISTRANT_COL_WIDTH = 180
const REGISTERED_AT_COL_WIDTH = 240
const REGISTRANT_COL_CLASS = 'detailed-program-page__registrant-col'
const REGISTERED_AT_COL_CLASS = 'detailed-program-page__registered-at-col'

/** Ant Radio `value`가 DOM/이벤트에서 문자열로 올 수 있어 저장·표시 전에 정규화 */
function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

export default function DetailedProgramPage() {
  const canWrite = canPerformWriteAction(useAuthStore(s => s.user))
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()

  const dpUseParam = searchParams.get('dp_use')
  useEffect(() => {
    if (dpUseParam === 'active' || dpUseParam === 'inactive') return
    setSearchParams(
      prev => {
        if (prev.get('dp_use') === 'active' || prev.get('dp_use') === 'inactive') return prev
        const next = new URLSearchParams(prev)
        next.set('dp_use', 'active')
        return next
      },
      { replace: true }
    )
  }, [dpUseParam, setSearchParams])

  const listQuery = useDetailedProgramListQuery(searchParams, true)
  const isInitialListLoading = isDataManagementListLoading(listQuery)
  const isListFetching = listQuery.isFetching
  const { createMutation, bulkUpdateMutation, bulkChangesMutation, deleteMutation } =
    useDetailedProgramMutations()
  const rows = listQuery.data ?? []
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  /** 저장 전까지 목록에서만 숨김(편집 모드 삭제 스테이징) */
  const [stagedDeleteIds, setStagedDeleteIds] = useState<string[]>([])
  /** 키 입력마다 setState 하지 않고 ref만 갱신해 테이블 전체 리렌더를 피한다 */
  const draftByIdRef = useRef<Record<string, DetailedProgramDraft>>({})
  const originalByIdRef = useRef<Record<string, DetailedProgramDraft>>({})
  const isEditModeRef = useRef(isEditMode)
  isEditModeRef.current = isEditMode
  const stagedDeleteIdsRef = useRef(stagedDeleteIds)
  stagedDeleteIdsRef.current = stagedDeleteIds
  const [nameErrorById, setNameErrorById] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [addItemModalKey, setAddItemModalKey] = useState(0)
  const [viewDeleteModalOpen, setViewDeleteModalOpen] = useState(false)
  const [viewDeleteModalTitle, setViewDeleteModalTitle] = useState(
    DETAILED_PROGRAM_DELETE_GUIDE_TITLE
  )
  const [viewDeleteModalLines, setViewDeleteModalLines] = useState<string[]>([])
  const viewDeletePendingIdsRef = useRef<string[]>([])
  /** 안내 확인 후 조회 모드면 API 삭제, 수정 모드면 스테이징만 */
  const pendingDeleteAppliesImmediatelyRef = useRef(true)
  const [deleteBlockedModalOpen, setDeleteBlockedModalOpen] = useState(false)
  const [deleteBlockedSelectedCount, setDeleteBlockedSelectedCount] = useState(1)

  const shouldBlockLeave = useCallback(() => {
    if (!isEditModeRef.current) return false
    return hasUnsavedDetailedProgramEdits({
      originals: originalByIdRef.current,
      drafts: draftByIdRef.current,
      stagedDeleteIds: stagedDeleteIdsRef.current,
    })
  }, [])

  const { leaveConfirmOpen, requestLeave, confirmLeave, cancelLeave } =
    useUnsavedLeaveGuard(shouldBlockLeave)

  const deleteBlockedCopy = useMemo(
    () =>
      resolveDeleteBlockedGuideCopy({
        entityLabel: '세부 프로그램',
        reasonLine: DETAILED_PROGRAM_DELETE_BLOCKED_REASON,
        selectedCount: deleteBlockedSelectedCount,
      }),
    [deleteBlockedSelectedCount]
  )

  const { pendingFilters, applySearch, handleFilterChange, displayedCount, tableData } =
    useTablePage(detailedProgramManagementTablePageConfig, {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    })

  const handleSearch = useCallback(() => {
    if (isEditMode) {
      return
    }
    applySearch()
  }, [applySearch, isEditMode])

  const enterEditMode = useCallback(() => {
    setStagedDeleteIds([])
    setNameErrorById({})
    const next: Record<string, DetailedProgramDraft> = {}
    for (const row of tableData) {
      next[row.id] = { name: row.name, active: row.active, version: row.version }
    }
    draftByIdRef.current = next
    originalByIdRef.current = Object.fromEntries(
      Object.entries(next).map(([id, draft]) => [id, { ...draft }])
    )
    setIsEditMode(true)
  }, [tableData])

  const exitEditMode = useCallback(() => {
    draftByIdRef.current = {}
    originalByIdRef.current = {}
    setIsEditMode(false)
    setStagedDeleteIds([])
    setNameErrorById({})
  }, [])

  const handleCancelEdit = useCallback(() => {
    requestLeave(() => {
      exitEditMode()
      setSelectedRowKeys([])
    })
  }, [exitEditMode, requestLeave])

  const handleSave = useCallback(async () => {
    if (isSaving) return
    const planned = planDetailedProgramSave({
      originals: originalByIdRef.current,
      drafts: draftByIdRef.current,
      stagedDeleteIds,
    })
    if (!planned.ok) {
      if (planned.block.reason !== 'over-max') {
        setNameErrorById(planned.block.nameErrorById)
      }
      cmsAlertModal.show({
        title: '저장 안내',
        content: planned.block.message,
      })
      return
    }

    const saveCall = resolveDetailedProgramSaveCall(planned.plan)
    if (saveCall.kind === 'none') {
      exitEditMode()
      setSelectedRowKeys([])
      return
    }

    setIsSaving(true)
    try {
      if (saveCall.kind === 'bulk-changes') {
        await bulkChangesMutation.mutateAsync(saveCall.request)
      } else if (saveCall.kind === 'bulk-update') {
        await bulkUpdateMutation.mutateAsync(saveCall.items)
      } else {
        await deleteMutation.mutateAsync(saveCall.ids)
      }
      exitEditMode()
      setSelectedRowKeys([])
      if (saveCall.kind === 'bulk-delete') {
        showDeleteCompletedAlert()
      } else {
        showUpdateCompletedAlert()
      }
    } catch (error) {
      if (isDetailedProgramConcurrentModificationError(error)) {
        cmsAlertModal.show({
          title: DETAILED_PROGRAM_CONCURRENT_MODIFICATION_TITLE,
          content: DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT,
          confirmLabel: '확인',
        })
        return
      }
      if (isDetailedProgramInUseDeleteError(error)) {
        setDeleteBlockedSelectedCount(planned.plan.deleteIds.length || 1)
        setDeleteBlockedModalOpen(true)
        return
      }
      const code = getApiErrorCode(error)
      const rowId = getDetailedProgramErrorRowId(error, planned.plan.updateItems)
      const fieldMessage = detailedProgramFieldErrorMessage(code)
      if (rowId && fieldMessage) {
        setNameErrorById({ [rowId]: fieldMessage })
      }
      cmsAlertModal.show({
        title: '저장 실패',
        content: getDetailedProgramApiErrorMessage(
          error,
          getDataManagementApiErrorMessage(error, '저장에 실패했습니다.')
        ),
      })
    } finally {
      setIsSaving(false)
    }
  }, [
    bulkChangesMutation,
    bulkUpdateMutation,
    deleteMutation,
    exitEditMode,
    isSaving,
    stagedDeleteIds,
  ])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }

    const selectedIds = selectedRowKeys.map(String)
    const selectedRows = rows.filter(r => selectedIds.includes(r.id))
    const deletableRows = selectedRows.filter(row => !row.inUse)

    if (deletableRows.length === 0) {
      setDeleteBlockedSelectedCount(selectedRows.length || 1)
      setDeleteBlockedModalOpen(true)
      return
    }

    if (!isEditMode && deletableRows.length > DETAILED_PROGRAM_BULK_MAX) {
      showAlert({
        title: '삭제 안내',
        content: detailedProgramBulkMaxMessage('delete'),
      })
      return
    }

    pendingDeleteAppliesImmediatelyRef.current = !isEditMode
    viewDeletePendingIdsRef.current = deletableRows.map(r => r.id)
    setViewDeleteModalTitle(detailedProgramDeleteGuideTitle(deletableRows.length))
    setViewDeleteModalLines(detailedProgramDeleteGuideLines(deletableRows.length))
    setViewDeleteModalOpen(true)
  }, [canWrite, isEditMode, rows, selectedRowKeys, showAlert])

  const handleAddClick = useCallback(() => {
    if (!canWrite) return
    setAddItemModalKey(k => k + 1)
    setAddItemModalOpen(true)
  }, [canWrite])

  const handleAddItemSubmit = useCallback(
    async (values: DetailedProgramAddItemValues) => {
      if (!canWrite) return
      try {
        await createMutation.mutateAsync({
          name: values.name,
          active: values.active,
        })
        setAddItemModalOpen(false)
        showRegisterCompletedAlert()
      } catch (error) {
        cmsAlertModal.show({
          title: '등록 실패',
          content: getDataManagementApiErrorMessage(error, '등록에 실패했습니다.'),
        })
      }
    },
    [canWrite, createMutation]
  )

  const updateDraft = useCallback((id: string, patch: Partial<DetailedProgramDraft>) => {
    const cur = draftByIdRef.current[id]
    if (!cur) return
    const nextPatch = { ...patch }
    if ('active' in nextPatch && nextPatch.active !== undefined) {
      nextPatch.active = coerceRadioBoolean(nextPatch.active)
    }
    draftByIdRef.current = { ...draftByIdRef.current, [id]: { ...cur, ...nextPatch } }
    setNameErrorById(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const stagedDeleteSet = useMemo(() => new Set(stagedDeleteIds), [stagedDeleteIds])

  /** 편집 중: 스테이징 삭제 제외. 뷰 모드: 서버 필터 결과. draft는 ref만 갱신 */
  const tableDisplayData = useMemo((): DetailedProgramManagementRow[] => {
    if (!isEditMode) return tableData
    return tableData.filter(row => !stagedDeleteSet.has(row.id))
  }, [isEditMode, stagedDeleteSet, tableData])

  const savePending =
    isSaving ||
    bulkUpdateMutation.isPending ||
    bulkChangesMutation.isPending ||
    deleteMutation.isPending

  const columns: ColumnsType<DetailedProgramManagementRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_: unknown, __: DetailedProgramManagementRow, index: number) =>
          tableDisplayData.length - index,
      },
      {
        title: '사용 여부',
        key: 'active',
        width: USAGE_COL_WIDTH,
        className: USAGE_COL_CLASS,
        align: 'center',
        render: (_: unknown, row: DetailedProgramManagementRow) => {
          if (!isEditMode) {
            return row.active ? '사용' : '미사용'
          }
          return (
            <CmsRadioGroup
              key={`active-${row.id}`}
              className="detailed-program-page__usage-radio"
              size="medium"
              defaultValue={row.active}
              onChange={e => updateDraft(row.id, { active: coerceRadioBoolean(e.target.value) })}
            >
              {USAGE_RADIO_OPTIONS.map(opt => (
                <CmsRadio key={String(opt.value)} size="medium" value={opt.value}>
                  {opt.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          )
        },
      },
      {
        title: '세부 프로그램명',
        dataIndex: 'name',
        key: 'name',
        className: 'detailed-program-page__name-col',
        ellipsis: !isEditMode,
        render: (_: unknown, row: DetailedProgramManagementRow) => {
          if (!isEditMode) {
            return row.name
          }
          const nameError = nameErrorById[row.id]
          return (
            <CmsInput
              key={`name-${row.id}`}
              className="detailed-program-page__name-input"
              inputSize="medium"
              width="100%"
              defaultValue={row.name}
              onChange={e => updateDraft(row.id, { name: e.target.value })}
              placeholder="세부 프로그램명"
              maxLength={200}
              error={Boolean(nameError)}
              message={nameError}
            />
          )
        },
      },
      {
        title: '등록자명',
        dataIndex: 'createdBy',
        key: 'createdBy',
        width: REGISTRANT_COL_WIDTH,
        className: REGISTRANT_COL_CLASS,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: REGISTERED_AT_COL_WIDTH,
        className: REGISTERED_AT_COL_CLASS,
        align: 'center',
        render: (v: string | undefined) =>
          v ? (
            dayjs(v).format('YYYY.MM.DD HH:mm:ss')
          ) : (
            <span style={{ color: 'var(--color-text-tertiary, #8c8c8c)' }}>-</span>
          ),
      },
    ],
    [isEditMode, nameErrorById, tableDisplayData.length, updateDraft]
  )

  return (
    <div className="detailed-program-page">
      <FilterTableLayout
        bordered={false}
        fields={detailedProgramManagementFilterFields}
        filters={{
          programName: pendingFilters.programName,
          usageStatus: pendingFilters.usageStatus,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="세부 프로그램 목록"
        description={`총 ${(isEditMode ? tableDisplayData.length : displayedCount).toLocaleString()}건`}
        contentLoading={isInitialListLoading}
        actions={
          <>
            {isEditMode ? (
              <>
                <FilterTableToolbarButton
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={savePending} >
                  취소
                </FilterTableToolbarButton>
                <FilterTableToolbarButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={savePending}
                  loading={savePending} >
                  저장
                </FilterTableToolbarButton>
              </>
            ) : (
              <>
                <FilterTableToolbarButton variant="delete" onClick={handleBulkDelete}>
                  항목 삭제
                </FilterTableToolbarButton>
                <FilterTableToolbarButton variant="secondary" onClick={enterEditMode}>
                  정보 수정
                </FilterTableToolbarButton>
                <FilterTableToolbarButton variant="primary" onClick={handleAddClick}>
                  신규 등록
                </FilterTableToolbarButton>
              </>
            )}
          </>
        }
        excelExport={{
          accessLog: { downloadKind: 'DETAILED_PROGRAM_LIST_EXPORT', containedPiiTypes: ['NAME'] },
          columns,
          data: tableDisplayData,
          selectedRowKeys,
        }}
      >
        <CmsDataTable<DetailedProgramManagementRow>
          rowKey="id"
          className={
            isEditMode
              ? 'cms-data-table detailed-program-page__table detailed-program-page__table--edit'
              : 'cms-data-table detailed-program-page__table'
          }
          columns={columns}
          dataSource={tableDisplayData}
          loading={isListFetching && !isInitialListLoading}
          pagination={false}
          rowSelection={
            canWrite
              ? {
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>

      <DetailedProgramAddItemModal
        key={addItemModalKey}
        open={addItemModalOpen}
        onCancel={() => setAddItemModalOpen(false)}
        onSubmit={handleAddItemSubmit}
      />

      <DeleteBlockedGuideModal
        open={deleteBlockedModalOpen}
        onClose={() => setDeleteBlockedModalOpen(false)}
        title={deleteBlockedCopy.title}
        description={deleteBlockedCopy.description}
      />

      <ConfirmModal
        open={leaveConfirmOpen}
        title="저장하지 않은 변경 사항이 있습니다."
        content="저장하지 않으면 변경 내용이 반영되지 않습니다. 계속하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />

      <DeleteGuideModal
        open={viewDeleteModalOpen}
        title={viewDeleteModalTitle}
        lines={viewDeleteModalLines}
        confirmText="삭제"
        confirmVariant="delete"
        confirmLoading={deleteMutation.isPending}
        onCancel={() => setViewDeleteModalOpen(false)}
        onConfirm={async () => {
          const ids = [...viewDeletePendingIdsRef.current]
          if (!pendingDeleteAppliesImmediatelyRef.current) {
            setStagedDeleteIds(prev => [...new Set([...prev, ...ids])])
            setSelectedRowKeys([])
            setViewDeleteModalOpen(false)
            setViewDeleteModalLines([])
            viewDeletePendingIdsRef.current = []
            return
          }
          try {
            await deleteMutation.mutateAsync(ids)
            setSelectedRowKeys([])
            setViewDeleteModalOpen(false)
            setViewDeleteModalLines([])
            viewDeletePendingIdsRef.current = []
            showDeleteCompletedAlert()
          } catch (error) {
            if (isDetailedProgramInUseDeleteError(error)) {
              setViewDeleteModalOpen(false)
              setDeleteBlockedSelectedCount(ids.length)
              setDeleteBlockedModalOpen(true)
              return
            }
            cmsAlertModal.show({
              title: '삭제 실패',
              content: getDataManagementApiErrorMessage(error, '삭제에 실패했습니다.'),
            })
          }
        }}
      />
    </div>
  )
}
