/**
 * Gemini 찾아가는 연수 — 모집 공고 탭 목록
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { mockGeminiVisitingTrainingRecruitmentRows } from '../model/gemini-visiting-training-recruitment-mock'
import { geminiVisitingTrainingRecruitmentFilterFields } from '../model/gemini-visiting-training-recruitment-filter-fields'
import {
  geminiVisitingTrainingRecruitmentTablePageConfig,
  type GeminiVisitingTrainingRecruitmentTableContext,
} from '../model/gemini-visiting-training-recruitment-table.config'
import type {
  GeminiVisitingTrainingRecruitmentRow,
  GeminiVisitingTrainingRecruitmentStatus,
} from '../model/gemini-visiting-training-types'
import { formatGeminiVisitingTrainingPeriodRange } from '../lib/format-gemini-visiting-training-period'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'
import './gemini-visiting-training-recruitment-list.css'

const RECRUITMENT_STATUS_LABEL: Record<GeminiVisitingTrainingRecruitmentStatus, string> = {
  SCHEDULED: '예정',
  IN_PROGRESS: '진행 중',
  ENDED: '종료',
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

function recruitmentStatusCell(status: GeminiVisitingTrainingRecruitmentStatus) {
  const base = 'gemini-visiting-training-recruitment-list__status'
  const modifier =
    status === 'SCHEDULED'
      ? `${base}--scheduled`
      : status === 'IN_PROGRESS'
        ? `${base}--in-progress`
        : `${base}--ended`
  return <span className={`${base} ${modifier}`}>{RECRUITMENT_STATUS_LABEL[status]}</span>
}

const EMPTY_TABLE_CONTEXT: GeminiVisitingTrainingRecruitmentTableContext = {}

export function GeminiVisitingTrainingRecruitmentList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(geminiVisitingTrainingRecruitmentTablePageConfig, {
    data: mockGeminiVisitingTrainingRecruitmentRows,
    searchParams,
    setSearchParams,
    context: EMPTY_TABLE_CONTEXT,
  })

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    // TODO: 모집 공고 선택 삭제 확인 모달·API 연동
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const handleAddRecruitment = useCallback(() => {
    if (!canWrite) return
    // TODO: 모집 공고 추가 모달/페이지 연동
  }, [canWrite])

  const columns: ColumnsType<GeminiVisitingTrainingRecruitmentRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        className: CMS_TABLE_NO_COL_CLASS,
        width: RECRUITMENT_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, row: GeminiVisitingTrainingRecruitmentRow) => row.displayNo,
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
        render: (_: unknown, row: GeminiVisitingTrainingRecruitmentRow) =>
          formatGeminiVisitingTrainingPeriodRange(
            row.applicationPeriodStart,
            row.applicationPeriodEnd
          ),
      },
      {
        title: '연수 요청 가능기간',
        key: 'trainingRequestPeriod',
        width: RECRUITMENT_COL_WIDTH.trainingRequestPeriod,
        align: 'center',
        render: (_: unknown, row: GeminiVisitingTrainingRecruitmentRow) =>
          formatGeminiVisitingTrainingPeriodRange(
            row.trainingRequestPeriodStart,
            row.trainingRequestPeriodEnd
          ),
      },
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: RECRUITMENT_COL_WIDTH.status,
        align: 'center',
        render: (status: GeminiVisitingTrainingRecruitmentStatus) =>
          recruitmentStatusCell(status),
      },
    ],
    []
  )

  return (
    <FilterTableLayout
      bordered={false}
      fields={geminiVisitingTrainingRecruitmentFilterFields}
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
          <CmsButton variant="delete" onClick={handleBulkDelete} disabled={!canWrite}>
            선택 삭제
          </CmsButton>
          <CmsButton variant="primary" onClick={handleAddRecruitment} disabled={!canWrite}>
            모집 공고 추가
          </CmsButton>
        </>
      }
    >
      <Table<GeminiVisitingTrainingRecruitmentRow>
        rowKey="id"
        className="cms-data-table gemini-visiting-training-recruitment-list__table"
        tableLayout="fixed"
        scroll={{ x: RECRUITMENT_TABLE_SCROLL_X }}
        columns={columns}
        dataSource={tableData}
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
  )
}
