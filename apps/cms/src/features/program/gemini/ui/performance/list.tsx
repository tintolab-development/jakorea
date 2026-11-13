import { useCallback, useMemo, useRef, useState, type ChangeEvent, type Key } from 'react'
import type { Dayjs } from 'dayjs'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { formatDateDot } from '@/shared/utils'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import '@/shared/ui/file-upload-picker.css'
import {
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
import { isGeminiPerformancePaidBlockedError } from '../../lib/performance/import-paid-duplicate'
import {
  GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
  GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
  GEMINI_PERFORMANCE_DELETE_BLOCKED_MESSAGE,
  GEMINI_PERFORMANCE_DELETE_BLOCKED_TITLE,
  GEMINI_PERFORMANCE_OVERWRITE_DONE_MESSAGE,
  GEMINI_PERFORMANCE_OVERWRITE_DONE_TITLE,
  GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE,
  GEMINI_PERFORMANCE_REGISTER_BLOCKED_TITLE,
  GEMINI_PERFORMANCE_UPLOAD_FAILED_MESSAGE,
  GEMINI_PERFORMANCE_UPLOAD_FAILED_TITLE,
} from '../../lib/performance/import-popup-copy'
import { useGeminiPerformanceRows } from '../../hooks/use-gemini-performance-rows'
import {
  getGeminiPerformanceDefaultDateRange,
  toGeminiPerformanceRemoteFilters,
  type GeminiPerformanceListUiFilters,
} from '../../lib/performance/list-remote-filters'
import { GEMINI_PERFORMANCE_FILTER_FIELDS } from '../../model/performance/filter-fields'
import type {
  GeminiPerformanceRow,
  GeminiPerformanceTrainingMethod,
} from '../../model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import { UploadDuplicateModal } from './upload-duplicate-modal'
import { GeminiImportPreviewFailureError } from '../../lib/performance/import-preview-failure'
import {
  isGeminiImportAuthFailure,
  isGeminiImportTransientFailure,
  summarizeGeminiImportFailure,
} from '../../lib/performance/import-failure-log'
import {
  isGlobalApiErrorAlertShown,
  showGlobalApiErrorAlert,
} from '@/shared/lib/show-global-api-error-alert'
import '@/pages/programs/program-list-page.css'
import '../page.css'
import './list.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

type PendingFilters = GeminiPerformanceListUiFilters

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

function createInitialFilters(): PendingFilters {
  const [from, to] = getGeminiPerformanceDefaultDateRange()
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
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingImportRows, setPendingImportRows] = useState<GeminiPerformanceRow[]>([])
  const [pendingRemoteImportRows, setPendingRemoteImportRows] = useState<
    GeminiTrainingReportImportRow[] | undefined
  >(undefined)

  // 강사·연수장소·연수방식·연수일 모두 서버 검색 쿼리로 보낸다(기본 연수일 포함, 첫 요청부터).
  // 조건이 바뀌면 queryKey가 바뀌어 page=0부터 다시 받는다.
  const queryFilters = useMemo(
    () => toGeminiPerformanceRemoteFilters(appliedFilters),
    [appliedFilters]
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

  const listCount = remoteEnabled ? totalElements : allRows.length

  const showNoSelectionAlert = useCallback(() => {
    showAlert(NO_SELECTION_ALERT)
  }, [showAlert])

  const showRegisterBlockedAlert = useCallback(() => {
    showAlert({
      title: GEMINI_PERFORMANCE_REGISTER_BLOCKED_TITLE,
      content: GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE,
    })
  }, [showAlert])

  const showImportFailureAlert = useCallback(
    (error: unknown) => {
      // 팝업은 시안 문구로 통일되어 원인이 가려지므로, 추적용 요약을 콘솔에 남긴다.
      console.error('[gemini-performance-import] failed', summarizeGeminiImportFailure(error))
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
      // 공통 인터셉터가 이미 오류 Alert를 띄웠으면(예: 모집 공고 조회 실패) 중복으로 띄우지 않는다.
      if (isGlobalApiErrorAlertShown(error)) return
      // preview·import는 공통 Alert를 끄므로 로그인·권한 오류는 공통 안내를 직접 띄운다.
      if (isGeminiImportAuthFailure(error)) {
        showGlobalApiErrorAlert(error)
        return
      }
      // 서버·네트워크 실패는 파일 문제가 아니므로 업로드 실패 안내를 띄운다(기능정의 0837).
      if (isGeminiImportTransientFailure(error)) {
        showAlert({
          title: GEMINI_PERFORMANCE_UPLOAD_FAILED_TITLE,
          content: GEMINI_PERFORMANCE_UPLOAD_FAILED_MESSAGE,
        })
        return
      }
      // 시안에 없는 행별 사유·서버 메시지는 노출하지 않고 양식 불일치 안내로 통일한다.
      showAlert({
        title: GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE,
        content: GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
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
      row => selectedIdSet.has(row.id) && row.deleteBlocked === true
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
        setDeleteModalOpen(false)
      } finally {
        setDeleting(false)
      }
    })()
  }, [deleting, selectedRowKeys, showAlert])

  const handleAddReportClick = useCallback(() => {
    if (importing) return
    // 권한이 없으면 버튼을 막지 않고 눌렀을 때 접근 불가 안내를 띄운다
    if (!canWrite) {
      showAdminAccessDeniedAlert()
      return
    }
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
        if (duplicateKeys.length > 0) {
          setPendingImportRows(importedRows)
          setPendingRemoteImportRows(remoteImportRows)
          setDuplicateModalOpen(true)
          return
        }
        await geminiPerformanceService.applyImport(importedRows, 'append', remoteImportRows)
        showAlert({
          title: GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
          content: GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
        })
      } catch (error) {
        showImportFailureAlert(error)
      } finally {
        endOverlay()
        setImporting(false)
      }
    },
    [importing, showAlert, showImportFailureAlert]
  )

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateModalOpen(false)
    clearPendingImport()
  }, [clearPendingImport])

  const handleDuplicateOverwrite = useCallback(() => {
    if (importing) return
    void (async () => {
      setImporting(true)
      const endOverlay = beginFileUploadOverlay()
      try {
        await geminiPerformanceService.applyImport(
          pendingImportRows,
          'overwrite',
          pendingRemoteImportRows
        )
        setDuplicateModalOpen(false)
        clearPendingImport()
        showAlert({
          title: GEMINI_PERFORMANCE_OVERWRITE_DONE_TITLE,
          content: GEMINI_PERFORMANCE_OVERWRITE_DONE_MESSAGE,
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
        await geminiPerformanceService.applyImport(
          pendingImportRows,
          'append',
          pendingRemoteImportRows
        )
        setDuplicateModalOpen(false)
        clearPendingImport()
        showAlert({
          title: GEMINI_PERFORMANCE_APPEND_DONE_TITLE,
          content: GEMINI_PERFORMANCE_APPEND_DONE_MESSAGE,
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
          accessLog: { downloadKind: 'GEMINI_TRAINING_PERFORMANCE_EXPORT', containedPiiTypes: ['NAME'] },
          columns,
          data: allRows,
          // 선택 행이 있으면 선택 행만, 없으면 조회 목록 전체를 내려받는다(QA 2026-11-13 Gemini #13).
          selectedRowKeys:
            showBulkDelete && selectedRowKeys.length > 0 ? selectedRowKeys : undefined,
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
                disabled={importing}
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
          dataSource={allRows}
          loading={remoteEnabled && isFetching && allRows.length === 0}
          pagination={false}
          rowSelection={
            showBulkDelete
              ? {
                  columnWidth: SELECTION_COL_WIDTH,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  // 지급 완료(deleteBlocked) 행도 엑셀 선택은 가능하다. 삭제 차단은 [선택 삭제]에서 안내한다.
                  preserveSelectedRowKeys: false,
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
