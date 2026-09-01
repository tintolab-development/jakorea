/**
 * Gemini 찾아가는 연수 — 모집 공고 탭 목록
 */

import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import dayjs from 'dayjs'
import { Alert, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { DELETE_GUIDE_TYPED_CONFIRM_VALUE } from '@/shared/constants/delete-guide-modal'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton, DeleteGuideModal, useCmsAlert } from '@/shared/ui'
import { geminiRecruitmentService } from '../../api/recruitment-service'
import {
  useGeminiRecruitmentRows,
  useGeminiRecruitmentRowsQueryState,
} from '../../hooks/use-gemini-recruitment-rows'
import { useToday } from '../../hooks/use-today'
import { GEMINI_RECRUITMENT_FILTER_FIELDS } from '../../model/recruitment/filter-fields'
import {
  geminiRecruitmentTablePageConfig,
  type GeminiRecruitmentTableContext,
} from '../../model/recruitment/table.config'
import type { GeminiRecruitmentDisplayStatus, GeminiRecruitmentRow } from '../../model/recruitment/types'
import { formatRecruitmentPeriodRange } from '../../lib/recruitment/format-period'
import { resolveRecruitmentDisplayStatus } from '../../lib/recruitment/resolve-status'
import { useGeminiRecruitmentDetailUrl } from '../detail/fullpage-modal'
import { useGeminiRecruitmentAddUrl } from './add-fullpage-modal'
import '@/pages/programs/program-list-page.css'
import './list.css'

const RECRUITMENT_STATUS_LABEL: Record<GeminiRecruitmentDisplayStatus, string> = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
  DRAFT: '임시저장',
}

const RECRUITMENT_COL_WIDTH = {
  no: TABLE_COLUMN_WIDTHS.index,
  title: 360,
  applicationPeriod: 280,
  trainingRequestPeriod: 280,
  status: 100,
} as const

const RECRUITMENT_TABLE_SCROLL_X =
  RECRUITMENT_COL_WIDTH.no +
  RECRUITMENT_COL_WIDTH.title +
  RECRUITMENT_COL_WIDTH.applicationPeriod +
  RECRUITMENT_COL_WIDTH.trainingRequestPeriod +
  RECRUITMENT_COL_WIDTH.status +
  TABLE_COLUMN_WIDTHS.checkbox +
  48

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
  const todayKey = useToday()
  const recruitmentRows = useGeminiRecruitmentRows()
  const { remoteEnabled, isFetching, isError, refetch } = useGeminiRecruitmentRowsQueryState()
  const { openDetail } = useGeminiRecruitmentDetailUrl()
  const { openAdd } = useGeminiRecruitmentAddUrl()

  const tableContext = useMemo<GeminiRecruitmentTableContext>(() => ({ todayKey }), [todayKey])

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(geminiRecruitmentTablePageConfig, {
    data: recruitmentRows,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
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
    setDeleteModalOpen(true)
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const handleConfirmDelete = useCallback(async () => {
    try {
      await geminiRecruitmentService.delete(selectedRowKeys.map(key => String(key)))
      setSelectedRowKeys([])
      setDeleteModalOpen(false)
      if (remoteEnabled) void refetch()
    } catch {
      showRemoteMutationUnavailable()
    }
  }, [refetch, remoteEnabled, selectedRowKeys, showRemoteMutationUnavailable])

  const handleAddRecruitment = useCallback(() => {
    if (!canWrite) return
    openAdd()
  }, [canWrite, openAdd])

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
        width: RECRUITMENT_COL_WIDTH.title,
        ellipsis: { showTitle: true },
      },
      {
        title: '신청기간',
        key: 'applicationPeriod',
        width: RECRUITMENT_COL_WIDTH.applicationPeriod,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) =>
          formatPeriodCell(row.applicationPeriodStart, row.applicationPeriodEnd),
      },
      {
        title: '연수 요청 가능기간',
        key: 'trainingRequestPeriod',
        width: RECRUITMENT_COL_WIDTH.trainingRequestPeriod,
        align: 'center',
        render: (_: unknown, row: GeminiRecruitmentRow) =>
          formatPeriodCell(row.trainingRequestPeriodStart, row.trainingRequestPeriodEnd),
      },
      {
        title: '상태',
        key: 'status',
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
      {remoteEnabled && isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="모집 공고 목록을 불러오지 못했습니다."
          action={
            <CmsButton variant="secondary" onClick={() => void refetch()}>
              다시 시도
            </CmsButton>
          }
        />
      ) : null}
      <FilterTableLayout
        bordered={false}
        filterResponsiveWrap={false}
        fields={GEMINI_RECRUITMENT_FILTER_FIELDS}
        filters={{
          title: pendingFilters.title,
          status: pendingFilters.status,
          trainingRequestPeriodRange: pendingFilters.trainingRequestPeriodRange ?? undefined,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="전체 모집 공고"
        description={`총 ${displayedCount.toLocaleString()}건`}
        actions={
          <>
            <CmsButton variant="delete" onClick={handleBulkDeleteClick} disabled={!canWrite}>
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" onClick={handleAddRecruitment} disabled={!canWrite}>
              모집 공고 추가
            </CmsButton>
          </>
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        <Table<GeminiRecruitmentRow>
          rowKey="id"
          className="cms-data-table gemini-recruitment-list__table"
          tableLayout="fixed"
          scroll={{ x: RECRUITMENT_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={tableData}
          loading={remoteEnabled && isFetching}
          pagination={false}
          onRow={record => ({
            onClick: (e: MouseEvent<HTMLElement>) => {
              if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
              if (record.isDraft) {
                openAdd()
                return
              }
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
      </FilterTableLayout>

      <DeleteGuideModal
        open={deleteModalOpen}
        title="선택 삭제"
        lines={[
          `선택한 ${selectedRowKeys.length}건의 모집 공고를 삭제하시겠습니까?`,
          '삭제된 모집 공고는 복구할 수 없습니다.',
        ]}
        confirmText="삭제"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
