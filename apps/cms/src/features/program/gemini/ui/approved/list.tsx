import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Alert, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  CmsButton, DeleteGuideModal, showDeleteCompletedAlert, useCmsAlert,
  FilterTableToolbarButton
} from '@/shared/ui'
import { useDeleteGeminiApprovedTrainingsMutation } from '../../api/visiting-training/hooks'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  geminiApprovedTrainingDeleteBlocked,
  resolveGeminiDeleteBlockedModalCopy,
  resolveGeminiDeleteGuideModalCopy,
} from '../../lib/delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import {
  buildApprovedTrainingExcelRows,
  GEMINI_APPROVED_TRAINING_EXCEL_COLUMNS,
} from '../../lib/approved/build-excel-export'
import {
  approvedTrainingStatusModifier,
  formatInstructorDisplay,
  formatRegionDisplay,
  formatStatusLabel,
  formatTrainingDatetimeDisplay,
} from '../../lib/approved/format-display'
import { resolveApprovedTrainingStatus } from '../../lib/approved/resolve-status'
import {
  useGeminiApprovedTrainingRows,
} from '../../hooks/use-gemini-approved-training-rows'
import { useToday } from '../../hooks/use-today'
import {
  GEMINI_APPROVED_TRAINING_FILTER_FIELDS,
  GEMINI_APPROVED_TRAINING_TRAILING_FILTER_KEYS,
} from '../../model/approved/filter-fields'
import type {
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { useGeminiApprovedTrainingDetailUrl } from './approved-training-detail-url'
import '@/pages/programs/program-list-page.css'
import '../page.css'
import './list.css'

type PendingFilters = {
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  status: GeminiApprovedTrainingStatus | 'ALL'
  officialDocumentRequired: 'ALL' | 'Y' | 'N'
  trainingDateRange: [Dayjs | null, Dayjs | null] | null
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  institutionName: 160,
  region: 170,
  status: 150,
  trainingDatetime: 320,
  studentCount: 100,
  instructorName: 100,
  managerName: 120,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
  COL.no +
  COL.institutionName +
  COL.region +
  COL.status +
  COL.trainingDatetime +
  COL.studentCount +
  COL.instructorName +
  COL.managerName +
  48

const INITIAL_PENDING_FILTERS: PendingFilters = {
  institutionName: '',
  institutionSido: '',
  institutionSigungu: '',
  status: 'ALL',
  officialDocumentRequired: 'ALL',
  trainingDateRange: null,
}

function statusText(status: GeminiApprovedTrainingStatus) {
  const base = 'gemini-approved-training-list__status'
  const modifier = `${base}--${approvedTrainingStatusModifier(status)}`
  return <span className={`${base} ${modifier}`}>{formatStatusLabel(status)}</span>
}

function instructorNameText(name: string) {
  if (name === '미지정') {
    return (
      <span className="gemini-approved-training-list__instructor gemini-approved-training-list__instructor--unassigned">
        {name}
      </span>
    )
  }
  return name
}

export function GeminiApprovedTrainingList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const { openDetail } = useGeminiApprovedTrainingDetailUrl()
  const todayKey = useToday()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedCopy, setDeleteBlockedCopy] = useState({ title: '', description: '' })
  const { mutateAsync: deleteApprovedTrainings } = useDeleteGeminiApprovedTrainingsMutation()
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const queryFilters = useMemo(
    () => ({
      institutionName: appliedFilters.institutionName || undefined,
      institutionSido: appliedFilters.institutionSido || undefined,
      institutionSigungu: appliedFilters.institutionSigungu || undefined,
      status: appliedFilters.status !== 'ALL' ? appliedFilters.status : undefined,
      officialDocumentRequired:
        appliedFilters.officialDocumentRequired !== 'ALL'
          ? appliedFilters.officialDocumentRequired
          : undefined,
      trainingDateFrom:
        appliedFilters.trainingDateRange?.[0]?.format('YYYY-MM-DD'),
      trainingDateTo:
        appliedFilters.trainingDateRange?.[1]?.format('YYYY-MM-DD'),
    }),
    [appliedFilters]
  )
  const {
    rows: filteredRows,
    remoteEnabled,
    isFetching,
    isFetchingNextPage,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    totalElements,
  } = useGeminiApprovedTrainingRows(queryFilters)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: JSON.stringify(queryFilters),
  })

  const excelRows = useMemo(
    () => buildApprovedTrainingExcelRows(filteredRows, todayKey),
    [filteredRows, todayKey]
  )

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkDeleteClick = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    const selectedIds = new Set(selectedRowKeys.map(key => String(key)))
    const selectedRows = filteredRows.filter(row => selectedIds.has(row.id))
    if (selectedRows.some(geminiApprovedTrainingDeleteBlocked)) {
      setDeleteBlockedCopy(
        resolveGeminiDeleteBlockedModalCopy('연수', selectedRowKeys.length)
      )
      setDeleteBlockedOpen(true)
      return
    }
    setDeleteModalOpen(true)
  }, [canWrite, filteredRows, selectedRowKeys, showNoSelectionAlert])

  const handleConfirmDelete = useCallback(async () => {
    setDeleteModalOpen(false)
    const selectedIds = selectedRowKeys.map(key => String(key))
    const selectedIdSet = new Set(selectedIds)
    const selectedRows = filteredRows.filter(row => selectedIdSet.has(row.id))
    if (selectedRows.some(geminiApprovedTrainingDeleteBlocked)) {
      setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('연수', selectedIds.length))
      setDeleteBlockedOpen(true)
      return
    }
    try {
      const result = await deleteApprovedTrainings(selectedIds)
      const deletedIds = new Set(result.successIds)
      setSelectedRowKeys(selectedIds.filter(id => !deletedIds.has(id)))
      if (result.failureCount > 0) {
        setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('연수', selectedIds.length))
        setDeleteBlockedOpen(true)
        return
      }
      showDeleteCompletedAlert()
    } catch {
      setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('연수', selectedIds.length))
      setDeleteBlockedOpen(true)
    }
  }, [deleteApprovedTrainings, filteredRows, selectedRowKeys])

  const columns: ColumnsType<GeminiApprovedTrainingRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institutionName,
        align: 'center',
      },
      {
        title: '기관 소재지',
        key: 'region',
        width: COL.region,
        align: 'center',
        render: (_: unknown, row) => formatRegionDisplay(row),
      },
      {
        title: '진행 현황',
        key: 'status',
        width: COL.status,
        align: 'center',
        render: (_: unknown, row) =>
          statusText(resolveApprovedTrainingStatus(row, dayjs(todayKey))),
      },
      {
        title: '연수일시',
        key: 'trainingDatetime',
        width: COL.trainingDatetime,
        align: 'center',
        render: (_: unknown, row) => (
          <div className="gemini-approved-training-list__training-datetime-cell">
            {renderProgramDetailPipeSeparated(formatTrainingDatetimeDisplay(row))}
          </div>
        ),
      },
      {
        title: '수강 인원',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: COL.studentCount,
        align: 'center',
        render: (count: number) => `${count}명`,
      },
      {
        title: '강사',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
        render: (_: unknown, row) => instructorNameText(formatInstructorDisplay(row)),
      },
      {
        title: '기관 담당자명',
        dataIndex: 'managerName',
        key: 'managerName',
        width: COL.managerName,
        align: 'center',
      },
    ],
    [todayKey]
  )

  return (
    <div className="program-list-page">
      {remoteEnabled && isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="승인 연수 목록을 불러오지 못했습니다."
          action={
            <CmsButton variant="secondary" onClick={() => void refetch()}>
              다시 시도
            </CmsButton>
          }
        />
      ) : null}
      <FilterTableLayout
        bordered={false}
        className="gemini-list-filter gemini-approved-training-list"
        filterResponsiveWrap
        multiRowGridMode="responsive"
        multiRowResponsiveLayout="merged-auto-fill"
        mergedAutoFillInlineSearch
        mergedAutoFillTrailingFieldKeys={GEMINI_APPROVED_TRAINING_TRAILING_FILTER_KEYS}
        fields={GEMINI_APPROVED_TRAINING_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          if (key === 'institutionSido') {
            setPendingFilters(prev => ({
              ...prev,
              institutionSido: value == null ? '' : String(value),
              institutionSigungu: '',
            }))
            return
          }
          if (key === 'institutionSigungu') {
            setPendingFilters(prev => ({
              ...prev,
              institutionSigungu: value == null ? '' : String(value),
            }))
            return
          }
          if (key === 'status') {
            setPendingFilters(prev => ({
              ...prev,
              status: (value == null ? 'ALL' : String(value)) as PendingFilters['status'],
            }))
            return
          }
          if (key === 'officialDocumentRequired') {
            setPendingFilters(prev => ({
              ...prev,
              officialDocumentRequired: (value == null
                ? 'ALL'
                : String(value)) as PendingFilters['officialDocumentRequired'],
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
        title="전체 승인 연수"
        description={`총 ${(remoteEnabled ? totalElements : filteredRows.length).toLocaleString()}건`}
        actions={
          <>
            <FilterTableToolbarButton variant="delete" onClick={handleBulkDeleteClick}>
              선택 삭제
            </FilterTableToolbarButton>
          </>
        }
        excelExport={{
          columns: GEMINI_APPROVED_TRAINING_EXCEL_COLUMNS,
          data: excelRows,
        }}
      >
        <CmsDataTable<GeminiApprovedTrainingRow>
          rowKey="id"
          className="cms-data-table gemini-approved-training-list__table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
          loading={remoteEnabled && isFetching && filteredRows.length === 0}
          pagination={false}
          onRow={record => ({
            onClick: (e: MouseEvent<HTMLElement>) => {
              if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
              openDetail(record.id)
            },
            style: { cursor: 'pointer' },
          })}
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
        {isFetchingNextPage ? <Spin size="small" aria-label="다음 승인 연수 불러오는 중" /> : null}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <DeleteGuideModal
        open={deleteModalOpen}
        title={resolveGeminiDeleteGuideModalCopy('연수', selectedRowKeys.length).title}
        lines={resolveGeminiDeleteGuideModalCopy('연수', selectedRowKeys.length).lines}
        confirmText="삭제"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
      <DeleteBlockedGuideModal
        open={deleteBlockedOpen}
        onClose={() => setDeleteBlockedOpen(false)}
        title={deleteBlockedCopy.title}
        description={deleteBlockedCopy.description}
      />
    </div>
  )
}
