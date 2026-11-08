/**
 * Gemini 찾아가는 연수 — 모집 공고 탭 목록
 */

import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  DeleteGuideModal,
  showDeleteCompletedAlert,
  useCmsAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import { useGeminiRecruitmentRows } from '../../hooks/use-gemini-recruitment-rows'
import { useToday } from '../../hooks/use-today'
import { GEMINI_RECRUITMENT_FILTER_FIELDS } from '../../model/recruitment/filter-fields'
import {
  geminiRecruitmentTablePageConfig,
  type GeminiRecruitmentTableContext,
} from '../../model/recruitment/table.config'
import type { GeminiRecruitmentDisplayStatus, GeminiRecruitmentRow } from '../../model/recruitment/types'
import { formatRecruitmentPeriodRange } from '../../lib/recruitment/format-period'
import { resolveRecruitmentDisplayStatus } from '../../lib/recruitment/resolve-status'
import {
  geminiRecruitmentDeleteBlocked,
  resolveGeminiDeleteBlockedModalCopy,
  resolveGeminiDeleteGuideModalCopy,
} from '../../lib/delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { peekGeminiRecruitmentAddDraftOverwrite } from '../../lib/recruitment/add-local-save'
import { useGeminiRecruitmentDetailUrl } from '../detail/recruitment-detail-url'
import { useGeminiRecruitmentAddUrl } from './recruitment-add-url'
import '@/pages/programs/program-list-page.css'
import '../page.css'
import './list.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

const RECRUITMENT_STATUS_LABEL: Record<GeminiRecruitmentDisplayStatus, string> = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
  DRAFT: '임시저장',
}

/** Figma 4315:124836 찾아가는 연수 모집 공고 목록 열 폭 */
const RECRUITMENT_SELECTION_COL_WIDTH = 60

const RECRUITMENT_COL_WIDTH = {
  no: TABLE_COLUMN_WIDTHS.index,
  title: 700,
  applicationPeriod: 280,
  trainingRequestPeriod: 280,
  status: 140,
} as const

const RECRUITMENT_TABLE_SCROLL_X =
  RECRUITMENT_SELECTION_COL_WIDTH +
  RECRUITMENT_COL_WIDTH.no +
  RECRUITMENT_COL_WIDTH.title +
  RECRUITMENT_COL_WIDTH.applicationPeriod +
  RECRUITMENT_COL_WIDTH.trainingRequestPeriod +
  RECRUITMENT_COL_WIDTH.status

function recruitmentStatusCell(status: GeminiRecruitmentDisplayStatus) {
  const base = 'gemini-recruitment-list__status'
  const modifier =
    status === 'SCHEDULED'
      ? `${base}--scheduled`
      : status === 'IN_PROGRESS'
        ? `${base}--in-progress`
        : status === 'ENDED'
          ? `${base}--ended`
          : `${base}--draft`
  return <span className={`${base} ${modifier}`}>{RECRUITMENT_STATUS_LABEL[status]}</span>
}

function formatPeriodCell(start: string, end: string): string {
  if (!start || !end) return '-'
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  if (!startDate.isValid() || !endDate.isValid()) return '-'
  return formatRecruitmentPeriodRange(start, end)
}

export function GeminiRecruitmentList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetNames, setDeleteTargetNames] = useState<string[]>([])
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false)
  const [deleteBlockedCopy, setDeleteBlockedCopy] = useState({ title: '', description: '' })
  const todayKey = useToday()
  const searchParamsKey = searchParams.toString()
  const { recruitmentId, openDetail } = useGeminiRecruitmentDetailUrl()
  const { openAdd } = useGeminiRecruitmentAddUrl()
  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')
  const detailOpen = Boolean(recruitmentId)
  const queryFilters = useMemo(() => {
    const params = new URLSearchParams(searchParamsKey)
    return {
      title: params.get('gvt_title') ?? undefined,
      status: params.get('gvt_status') ?? undefined,
    }
  }, [searchParamsKey])
  const {
    rows: recruitmentRows,
    remoteEnabled,
    isFetching,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
    hasNextPage,
    totalElements,
  } = useGeminiRecruitmentRows(queryFilters)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: JSON.stringify(queryFilters),
  })

  const tableContext = useMemo<GeminiRecruitmentTableContext>(() => ({ todayKey }), [todayKey])

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
    hasActiveFilters,
  } = useTablePage(geminiRecruitmentTablePageConfig, {
    data: recruitmentRows,
    searchParams,
    setSearchParams,
    context: tableContext,
    disableUrlSync: detailOpen,
  })

  const showNoSelectionAlert = useCallback(() => {
    showAlert(NO_SELECTION_ALERT)
  }, [showAlert])

  const showRemoteMutationUnavailable = useCallback(() => {
    showAlert({
      title: '안내',
      content:
        '모집 공고 등록/삭제를 처리하지 못했습니다.\n잠시 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkDeleteClick = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    const selectedIds = new Set(selectedRowKeys.map(key => String(key)))
    const selectedRows = tableData.filter(row => selectedIds.has(row.id))
    if (selectedRows.some(geminiRecruitmentDeleteBlocked)) {
      setDeleteBlockedCopy(resolveGeminiDeleteBlockedModalCopy('공고', selectedRows.length))
      setDeleteBlockedOpen(true)
      return
    }
    setDeleteTargetNames(selectedRows.map(row => row.title))
    setDeleteModalOpen(true)
  }, [canWrite, selectedRowKeys, showAlert, showNoSelectionAlert, tableData])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await geminiRecruitmentService.delete(selectedRowKeys.map(key => String(key)))
      setSelectedRowKeys([])
      setDeleteTargetNames([])
      setDeleteModalOpen(false)
      if (remoteEnabled) void refetch()
      showDeleteCompletedAlert()
    } catch {
      showRemoteMutationUnavailable()
    }
  }, [refetch, remoteEnabled, selectedRowKeys, showRemoteMutationUnavailable])

  const handleCancelDelete = useCallback(() => {
    setDeleteTargetNames([])
    setDeleteModalOpen(false)
  }, [])

  const handleAddRecruitment = useCallback(() => {
    if (!canWrite) return
    const draft = peekGeminiRecruitmentAddDraftOverwrite()
    if (draft != null) {
      setDraftNoticeTitle(draft.title)
      setDraftNoticeOpen(true)
      return
    }
    openAdd('fresh')
  }, [canWrite, openAdd])

  const handleDraftNoticeConfirm = useCallback(
    (choice: RegistrationDraftNoticeChoice) => {
      setDraftNoticeOpen(false)
      if (choice === 'fresh') {
        openAdd('fresh')
        return
      }
      openAdd('continue')
    },
    [openAdd]
  )

  const columns: ColumnsType<GeminiRecruitmentRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        className: CMS_TABLE_NO_COL_CLASS,
        width: RECRUITMENT_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) => row.displayNo,
      },
      {
        title: '공고명',
        dataIndex: 'title',
        key: 'title',
        className: 'gemini-recruitment-list__col-title',
        width: RECRUITMENT_COL_WIDTH.title,
        ellipsis: { showTitle: true },
      },
      {
        title: '신청기간',
        key: 'applicationPeriod',
        className: 'gemini-recruitment-list__col-period',
        width: RECRUITMENT_COL_WIDTH.applicationPeriod,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) =>
          formatPeriodCell(row.applicationPeriodStart, row.applicationPeriodEnd),
      },
      {
        title: '연수 요청 가능기간',
        key: 'trainingRequestPeriod',
        className: 'gemini-recruitment-list__col-period',
        width: RECRUITMENT_COL_WIDTH.trainingRequestPeriod,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) =>
          formatPeriodCell(row.trainingRequestPeriodStart, row.trainingRequestPeriodEnd),
      },
      {
        title: '상태',
        key: 'status',
        className: 'gemini-recruitment-list__col-status',
        width: RECRUITMENT_COL_WIDTH.status,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) =>
          recruitmentStatusCell(resolveRecruitmentDisplayStatus(row, dayjs(todayKey))),
      },
    ],
    [todayKey]
  )

  return (
    <div className="program-list-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        bordered={false}
        className="gemini-list-filter gemini-recruitment-list"
        filterResponsiveWrap
        multiRowGridMode="responsive"
        multiRowResponsiveLayout="merged-auto-fill"
        mergedAutoFillInlineSearch
        fields={GEMINI_RECRUITMENT_FILTER_FIELDS}
        filters={{
          title: pendingFilters.title,
          status: pendingFilters.status,
          trainingRequestPeriodRange: pendingFilters.trainingRequestPeriodRange ?? undefined,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="전체 모집 공고"
        description={`총 ${(remoteEnabled ? totalElements : displayedCount).toLocaleString()}건`}
        actions={
          <>
            <FilterTableToolbarButton variant="delete" onClick={handleBulkDeleteClick}>
              선택 삭제
            </FilterTableToolbarButton>
            <FilterTableToolbarButton variant="primary" onClick={handleAddRecruitment}>
              모집 공고 등록
            </FilterTableToolbarButton>
          </>
        }
        excelExport={{
          columns,
          data: tableData,
          selectedRowKeys: canWrite ? selectedRowKeys : undefined,
        }}
      >
        <CmsDataTable<GeminiRecruitmentRow>
          rowKey="id"
          className="cms-data-table gemini-recruitment-list__table"
          tableLayout="fixed"
          scroll={{ x: RECRUITMENT_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={tableData}
          loading={remoteEnabled && isFetching && tableData.length === 0}
          pagination={false}
          onRow={record => ({
            onClick: (e: MouseEvent<HTMLElement>) => {
              if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
              // 임시저장도 서버 공고다. 추가 폼은 브라우저 초안만 복원해서 등록값이 비어 보인다.
              openDetail(record.id)
            },
            style: { cursor: 'pointer' },
          })}
          rowSelection={
            canWrite
              ? {
                  columnWidth: RECRUITMENT_SELECTION_COL_WIDTH,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
        {isFetchingNextPage ? <Spin size="small" aria-label="다음 모집 공고 불러오는 중" /> : null}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <DeleteGuideModal
        open={deleteModalOpen}
        title={
          resolveGeminiDeleteGuideModalCopy('공고', selectedRowKeys.length, deleteTargetNames).title
        }
        lines={
          resolveGeminiDeleteGuideModalCopy('공고', selectedRowKeys.length, deleteTargetNames).lines
        }
        confirmText="삭제"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <RegistrationDraftNoticeModal
        open={draftNoticeOpen}
        draftTitle={draftNoticeTitle}
        onCancel={() => setDraftNoticeOpen(false)}
        onConfirm={handleDraftNoticeConfirm}
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
