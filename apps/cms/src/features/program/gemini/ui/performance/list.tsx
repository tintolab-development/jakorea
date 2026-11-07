import { useCallback, useMemo, useRef, useState, type ChangeEvent, type Key } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { formatDateDot } from '@/shared/utils'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import '@/shared/ui/file-upload-picker.css'
import {
  ConfirmModal,
  DeleteGuideModal,
  showDeleteCompletedAlert,
  useCmsAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE,
  GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_MESSAGE,
  GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_TITLE,
  geminiPerformanceService,
} from '../../api/performance-service'
import { resolveGeminiDeleteGuideModalCopy } from '../../lib/delete-guide'
import { formatGeminiApiError } from '../../lib/gemini-api-error'
import {
  isGeminiPerformanceAccountPaid,
  isGeminiPerformancePaidBlockedError,
} from '../../lib/performance/import-paid-duplicate'
import {
  GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
  GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
  GEMINI_PERFORMANCE_DELETE_BLOCKED_MESSAGE,
  GEMINI_PERFORMANCE_DELETE_BLOCKED_TITLE,
  GEMINI_PERFORMANCE_OVERWRITE_DONE_MESSAGE,
  GEMINI_PERFORMANCE_OVERWRITE_DONE_TITLE,
  GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE,
  GEMINI_PERFORMANCE_REGISTER_BLOCKED_TITLE,
} from '../../lib/performance/import-popup-copy'
import { useGeminiPerformanceRows } from '../../hooks/use-gemini-performance-rows'
import { GEMINI_PERFORMANCE_FILTER_FIELDS } from '../../model/performance/filter-fields'
import type {
  GeminiPerformanceRow,
  GeminiPerformanceTrainingMethod,
} from '../../model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import { UploadDuplicateModal } from './upload-duplicate-modal'
import { GeminiImportPreviewFailureError } from '../../lib/performance/import-preview-failure'
import '@/pages/programs/program-list-page.css'
import '../page.css'
import './list.css'

type PendingFilters = {
  instructorName: string
  trainingMethod: 'ALL' | GeminiPerformanceTrainingMethod
  trainingLocation: string
  trainingDateRange: [Dayjs | null, Dayjs | null] | null
}

const TRAINING_METHOD_LABEL: Record<GeminiPerformanceTrainingMethod, string> = {
  OFFLINE: '오프라인',
  ONLINE: '온라인',
}

/** Figma 4315:124368 실적 목록 열 폭 */
const SELECTION_COL_WIDTH = 60

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  trainingLocation: 149,
  trainingDate: TABLE_COLUMN_WIDTHS.date,
  participantCount: 120,
  detailTimeText: 120,
  trainingHours: 120,
  trainingTopic: 157,
  instructorName: 120,
  assistantInstructorNames: 120,
  instructorCount: 100,
  trainingFormat: 123,
  trainingMethod: 149,
} as const

const TABLE_SCROLL_X =
  SELECTION_COL_WIDTH +
  COL.no +
  COL.trainingLocation +
  COL.trainingDate +
  COL.participantCount +
  COL.detailTimeText +
  COL.trainingHours +
  COL.trainingTopic +
  COL.instructorName +
  COL.assistantInstructorNames +
  COL.instructorCount +
  COL.trainingFormat +
  COL.trainingMethod +
  48

function getDefaultDateRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('year'), dayjs()]
}

function createInitialFilters(): PendingFilters {
  const [from, to] = getDefaultDateRange()
  return {
    instructorName: '',
    trainingMethod: 'ALL',
    trainingLocation: '',
    trainingDateRange: [from, to],
  }
}

function formatTrainingDate(rawDate: string): string {
  const formatted = formatDateDot(rawDate)
  return formatted.trim() ? formatted : '-'
}

function displayCell(value: string | number | null | undefined): string {
  if (value == null) return '-'
  if (typeof value === 'number' && !Number.isFinite(value)) return '-'
  const text = String(value).trim()
  return text && text !== '-' ? text : '-'
}

function appendPaymentExclusionNotes(baseMessage: string, notes?: string): string {
  const normalizedNotes = notes?.trim()
  return normalizedNotes ? `${baseMessage}\n${normalizedNotes}` : baseMessage
}

/** 서버에서 처리하지 않는 조건만 클라이언트에서 좁힌다(방식·연수일). */
function filterRowsClientOnly(rows: GeminiPerformanceRow[], filters: PendingFilters) {
  return rows.filter(row => {
    if (filters.trainingMethod !== 'ALL' && row.trainingMethod !== filters.trainingMethod) {
      return false
    }
    if (filters.trainingDateRange?.[0] && filters.trainingDateRange[1]) {
      const rowDate = dayjs(row.trainingDate)
      const from = filters.trainingDateRange[0].startOf('day')
      const to = filters.trainingDateRange[1].endOf('day')
      if (rowDate.isBefore(from) || rowDate.isAfter(to)) {
        return false
      }
    }
    return true
  })
}

export function GeminiPerformanceList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(createInitialFilters)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(createInitialFilters)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingImportRows, setPendingImportRows] = useState<GeminiPerformanceRow[]>([])
  const [pendingRemoteImportRows, setPendingRemoteImportRows] = useState<
    GeminiTrainingReportImportRow[] | undefined
  >(undefined)

  const queryFilters = useMemo(
    () => ({
      instructorName: appliedFilters.instructorName.trim() || undefined,
      trainingLocation: appliedFilters.trainingLocation.trim() || undefined,
    }),
    [appliedFilters.instructorName, appliedFilters.trainingLocation]
  )
  const {
    rows: allRows,
    remoteEnabled,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    totalElements,
  } = useGeminiPerformanceRows(queryFilters)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: JSON.stringify(queryFilters),
  })

  const filteredRows = useMemo(
    () => filterRowsClientOnly(allRows, appliedFilters),
    [allRows, appliedFilters]
  )
  const listCount = remoteEnabled ? totalElements : filteredRows.length

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const showRegisterBlockedAlert = useCallback(() => {
    showAlert({
      title: GEMINI_PERFORMANCE_REGISTER_BLOCKED_TITLE,
      content: GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE,
    })
  }, [showAlert])

  const showImportFailureAlert = useCallback(
    (error: unknown) => {
      if (isGeminiPerformancePaidBlockedError(error)) {
        showRegisterBlockedAlert()
        return
      }
      if (
        error instanceof GeminiImportPreviewFailureError &&
        error.kind === 'INSTRUCTOR_INFO_MISMATCH'
      ) {
        showAlert({
          title: GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_TITLE,
          content: GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_MESSAGE,
        })
        return
      }
      const message =
        error instanceof Error && error.message === GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE
          ? GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE
          : formatGeminiApiError(error, '파일 업로드에 실패했습니다.\n잠시 후 다시 시도해 주세요.')
      showAlert({
        title:
          message === GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE
            ? GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE
            : '안내',
        content: message,
      })
    },
    [showAlert, showRegisterBlockedAlert]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    const selectedIdSet = new Set(selectedRowKeys.map(key => String(key)))
    const paidSelected = allRows.some(
      row => selectedIdSet.has(row.id) && isGeminiPerformanceAccountPaid(row.accountPaymentId)
    )
    if (paidSelected) {
      showAlert({
        title: GEMINI_PERFORMANCE_DELETE_BLOCKED_TITLE,
        content: GEMINI_PERFORMANCE_DELETE_BLOCKED_MESSAGE,
      })
      return
    }
    setDeleteModalOpen(true)
  }, [allRows, canWrite, selectedRowKeys, showAlert, showNoSelectionAlert])

  const handleConfirmDelete = useCallback(() => {
    if (deleting) return
    void (async () => {
      setDeleting(true)
      try {
        await geminiPerformanceService.delete(selectedRowKeys.map(key => String(key)))
        setSelectedRowKeys([])
        setDeleteModalOpen(false)
        showDeleteCompletedAlert()
      } catch (error) {
        if (isGeminiPerformancePaidBlockedError(error)) {
          setDeleteModalOpen(false)
          showAlert({
            title: GEMINI_PERFORMANCE_DELETE_BLOCKED_TITLE,
            content: GEMINI_PERFORMANCE_DELETE_BLOCKED_MESSAGE,
          })
          return
        }
        showAlert({
          title: '안내',
          content: formatGeminiApiError(
            error,
            '실적 삭제를 완료하지 못했습니다.\n잠시 후 다시 시도해 주세요.'
          ),
        })
      } finally {
        setDeleting(false)
      }
    })()
  }, [deleting, selectedRowKeys, showAlert])

  const handleAddReportClick = useCallback(() => {
    if (!canWrite || importing) return
    openFilePicker(fileInputRef.current)
  }, [canWrite, importing])

  const clearPendingImport = useCallback(() => {
    setPendingImportRows([])
    setPendingRemoteImportRows(undefined)
  }, [])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || importing) return

      setImporting(true)
      const endOverlay = beginFileUploadOverlay()
      try {
        // 지급완료 중복은 prepareImport가 REGISTER_BLOCKED로 throw → 등록 불가 안내(import 미호출)
        const { importedRows, duplicateKeys, remoteImportRows } =
          await geminiPerformanceService.prepareImport(file)
        setPendingImportRows(importedRows)
        setPendingRemoteImportRows(remoteImportRows)
        if (duplicateKeys.length > 0) {
          setDuplicateModalOpen(true)
          return
        }
        setImportConfirmOpen(true)
      } catch (error) {
        showImportFailureAlert(error)
      } finally {
        endOverlay()
        setImporting(false)
      }
    },
    [importing, showImportFailureAlert]
  )

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateModalOpen(false)
    clearPendingImport()
  }, [clearPendingImport])

  const handleImportConfirmCancel = useCallback(() => {
    if (importing) return
    setImportConfirmOpen(false)
    clearPendingImport()
  }, [clearPendingImport, importing])

  const handleImportConfirm = useCallback(() => {
    if (importing) return
    void (async () => {
      setImporting(true)
      const endOverlay = beginFileUploadOverlay()
      try {
        const result = await geminiPerformanceService.applyImport(
          pendingImportRows,
          'append',
          pendingRemoteImportRows
        )
        setImportConfirmOpen(false)
        clearPendingImport()
        showAlert({
          title: GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
          content: appendPaymentExclusionNotes(
            GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
            result?.paymentExclusionNotes
          ),
        })
      } catch (error) {
        showImportFailureAlert(error)
      } finally {
        endOverlay()
        setImporting(false)
      }
    })()
  }, [
    clearPendingImport,
    importing,
    pendingImportRows,
    pendingRemoteImportRows,
    showAlert,
    showImportFailureAlert,
  ])

  const handleDuplicateOverwrite = useCallback(() => {
    if (importing) return
    void (async () => {
      setImporting(true)
      const endOverlay = beginFileUploadOverlay()
      try {
        const result = await geminiPerformanceService.applyImport(
          pendingImportRows,
          'overwrite',
          pendingRemoteImportRows
        )
        setDuplicateModalOpen(false)
        clearPendingImport()
        showAlert({
          title: GEMINI_PERFORMANCE_OVERWRITE_DONE_TITLE,
          content: appendPaymentExclusionNotes(
            GEMINI_PERFORMANCE_OVERWRITE_DONE_MESSAGE,
            result?.paymentExclusionNotes
          ),
        })
      } catch (error) {
        showImportFailureAlert(error)
      } finally {
        endOverlay()
        setImporting(false)
      }
    })()
  }, [
    clearPendingImport,
    importing,
    pendingImportRows,
    pendingRemoteImportRows,
    showAlert,
    showImportFailureAlert,
  ])

  const handleDuplicateAppend = useCallback(() => {
    if (importing) return
    void (async () => {
      setImporting(true)
      const endOverlay = beginFileUploadOverlay()
      try {
        const result = await geminiPerformanceService.applyImport(
          pendingImportRows,
          'append',
          pendingRemoteImportRows
        )
        setDuplicateModalOpen(false)
        clearPendingImport()
        showAlert({
          title: GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
          content: appendPaymentExclusionNotes(
            GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
            result?.paymentExclusionNotes
          ),
        })
      } catch (error) {
        showImportFailureAlert(error)
      } finally {
        endOverlay()
        setImporting(false)
      }
    })()
  }, [
    clearPendingImport,
    importing,
    pendingImportRows,
    pendingRemoteImportRows,
    showAlert,
    showImportFailureAlert,
  ])

  const columns: ColumnsType<GeminiPerformanceRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '연수장소',
        dataIndex: 'trainingLocation',
        key: 'trainingLocation',
        width: COL.trainingLocation,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '연수일',
        key: 'trainingDate',
        width: COL.trainingDate,
        align: 'center',
        render: (_: unknown, row) => formatTrainingDate(row.trainingDate),
      },
      {
        title: '연수인원',
        dataIndex: 'participantCount',
        key: 'participantCount',
        width: COL.participantCount,
        align: 'center',
        render: (value: number | null) => displayCell(value),
      },
      {
        title: '세부시간',
        dataIndex: 'detailTimeText',
        key: 'detailTimeText',
        width: COL.detailTimeText,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '연수시간',
        dataIndex: 'trainingHours',
        key: 'trainingHours',
        width: COL.trainingHours,
        align: 'center',
        render: (value: number | null) => displayCell(value),
      },
      {
        title: '연수주제',
        dataIndex: 'trainingTopic',
        key: 'trainingTopic',
        width: COL.trainingTopic,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '강사',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '보조강사',
        dataIndex: 'assistantInstructorNames',
        key: 'assistantInstructorNames',
        width: COL.assistantInstructorNames,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '강사인원',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: COL.instructorCount,
        align: 'center',
        render: (value: number | null) => displayCell(value),
      },
      {
        title: '연수 형태',
        dataIndex: 'trainingFormat',
        key: 'trainingFormat',
        width: COL.trainingFormat,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => displayCell(value),
      },
      {
        title: '연수방식',
        dataIndex: 'trainingMethod',
        key: 'trainingMethod',
        width: COL.trainingMethod,
        align: 'center',
        render: (method: GeminiPerformanceTrainingMethod) => TRAINING_METHOD_LABEL[method],
      },
    ],
    []
  )

  const showBulkDelete = canWrite
  const tableScrollX = showBulkDelete ? TABLE_SCROLL_X : TABLE_SCROLL_X - SELECTION_COL_WIDTH

  const performanceDeleteGuide = resolveGeminiDeleteGuideModalCopy('실적', selectedRowKeys.length)

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        className="gemini-list-filter gemini-performance-list"
        fields={GEMINI_PERFORMANCE_FILTER_FIELDS}
        filters={{
          instructorName: pendingFilters.instructorName,
          trainingMethod: pendingFilters.trainingMethod,
          trainingLocation: pendingFilters.trainingLocation,
          trainingDateRange: pendingFilters.trainingDateRange ?? undefined,
        }}
        onFilterChange={(key, value) => {
          if (key === 'trainingMethod') {
            setPendingFilters(prev => ({
              ...prev,
              trainingMethod: (value == null
                ? 'ALL'
                : String(value)) as PendingFilters['trainingMethod'],
            }))
            return
          }
          if (key === 'trainingDateRange') {
            setPendingFilters(prev => ({
              ...prev,
              trainingDateRange: value as [Dayjs | null, Dayjs | null] | null,
            }))
            return
          }
          setPendingFilters(prev => ({
            ...prev,
            [key]: value == null ? '' : String(value),
          }))
        }}
        onSearch={() => setAppliedFilters(pendingFilters)}
        title="전체 프로그램"
        description={`총 ${listCount.toLocaleString()}건`}
        actions={
          showBulkDelete ? (
            <FilterTableToolbarButton variant="delete" onClick={handleBulkDeleteClick}>
              선택 삭제
            </FilterTableToolbarButton>
          ) : null
        }
        excelExport={{
          columns,
          data: filteredRows,
          selectedRowKeys: showBulkDelete ? selectedRowKeys : undefined,
        }}
        actionsAfterExcel={
          <span className="file-upload-picker">
            <span className="file-upload-picker">
              {canWrite ? (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="file-upload-picker__input"
                  aria-label="연수 보고서 등록"
                  onChange={event => void handleFileChange(event)}
                />
              ) : null}
              <FilterTableToolbarButton
                variant="primary"
                tabIndex={canWrite ? -1 : undefined}
                disabled={!canWrite || importing}
                onClick={handleAddReportClick}
              >
                연수 보고서 등록
              </FilterTableToolbarButton>
            </span>
          </span>
        }
      >
        <CmsDataTable<GeminiPerformanceRow>
          rowKey="id"
          className="cms-data-table gemini-performance-list__table"
          tableLayout="fixed"
          scroll={{ x: tableScrollX }}
          columns={columns}
          dataSource={filteredRows}
          loading={remoteEnabled && isFetching && filteredRows.length === 0}
          pagination={false}
          rowSelection={
            showBulkDelete
              ? {
                  columnWidth: SELECTION_COL_WIDTH,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  preserveSelectedRowKeys: false,
                  getCheckboxProps: (row: GeminiPerformanceRow) => ({
                    disabled: isGeminiPerformanceAccountPaid(row.accountPaymentId),
                  }),
                }
              : undefined
          }
        />
        {isFetchingNextPage ? (
          <Spin size="small" aria-label="다음 연수 보고서 불러오는 중" />
        ) : null}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      {showBulkDelete ? (
        <DeleteGuideModal
          open={deleteModalOpen}
          title={performanceDeleteGuide.title}
          lines={performanceDeleteGuide.lines}
          confirmText="삭제"
          confirmLoading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (deleting) return
            setDeleteModalOpen(false)
          }}
        />
      ) : null}
      <ConfirmModal
        open={importConfirmOpen}
        title="연수 보고서 등록"
        content={`${pendingImportRows.length.toLocaleString()}건의 연수 보고서를 등록하시겠습니까?`}
        confirmText="등록"
        confirmLoading={importing}
        onConfirm={handleImportConfirm}
        onCancel={handleImportConfirmCancel}
      />
      <UploadDuplicateModal
        open={duplicateModalOpen}
        loading={importing}
        onCancel={handleDuplicateCancel}
        onOverwrite={handleDuplicateOverwrite}
        onAppend={handleDuplicateAppend}
      />
    </div>
  )
}
