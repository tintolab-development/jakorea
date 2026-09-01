import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import { useNavigate } from 'react-router-dom'
import type { UseProgramHistoryFilterReturn } from '@/features/sponsor/hooks/use-program-history-filter'
import type { SponsorProgramHistoryRow } from '@/features/sponsor/model/sponsor-management.types'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  CmsButton,
  DeleteGuideModal,
  ProgramHistoryDeleteBlockedModal,
  buildProgramProgressHistoryDeleteGuide,
} from '@/shared/ui'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { buildProgressYearSelectOptions } from '@/shared/utils'
import { SPONSOR_PROGRAM_HISTORY_FILTER_ALL } from '@/features/sponsor/utils/match-program-history-filter'
import {
  getEnrollmentDisplayStatusFromProgramLifecycle,
  isProgramHistoryDeleteBlockedByDisplayStatus,
} from '@/shared/constants/status'

const LIFECYCLE_OPTIONS = [
  { label: '전체', value: SPONSOR_PROGRAM_HISTORY_FILTER_ALL },
  { label: '프로그램 진행 예정', value: 'planned' },
  { label: '프로그램 진행 중', value: 'education_in_progress' },
  { label: '프로그램 진행 완료', value: 'education_completed' },
] as const

const PARTICIPANT_TYPE_OPTIONS = [
  { label: '전체', value: SPONSOR_PROGRAM_HISTORY_FILTER_ALL },
  { label: '학교/기관', value: 'school' },
  { label: '개인 학습자', value: 'individual' },
  { label: '봉사자', value: 'volunteer' },
] as const

const EDUCATION_TARGET_OPTIONS = [
  { label: '전체', value: SPONSOR_PROGRAM_HISTORY_FILTER_ALL },
  { label: '초등학생', value: 'elementary' },
  { label: '중학생', value: 'middle' },
  { label: '고등학생', value: 'high' },
  { label: '대학생', value: 'college' },
  { label: '성인', value: 'adult' },
] as const

const programHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: '16%',
  },
  {
    key: 'year',
    type: 'select',
    label: '진행년도',
    placeholder: '전체',
    options: buildProgressYearSelectOptions(SPONSOR_PROGRAM_HISTORY_FILTER_ALL),
    width: '14%',
  },
  {
    key: 'lifecycleStatus',
    type: 'select',
    label: '프로그램 진행 현황',
    placeholder: '전체',
    options: [...LIFECYCLE_OPTIONS],
    width: '16%',
  },
  {
    key: 'participantType',
    type: 'select',
    label: '참여자 유형',
    placeholder: '전체',
    options: [...PARTICIPANT_TYPE_OPTIONS],
    width: '14%',
  },
  {
    key: 'educationTarget',
    type: 'select',
    label: '교육 대상',
    placeholder: '전체',
    options: [...EDUCATION_TARGET_OPTIONS],
    width: '14%',
  },
  {
    key: 'managerName',
    type: 'search',
    label: '후원사 담당자명',
    placeholder: '후원사 담당자명을 입력하세요',
    width: '16%',
  },
]

export type SponsorProgramHistoryPanelProps = UseProgramHistoryFilterReturn & {
  columns: ColumnsType<SponsorProgramHistoryRow>
  canWrite: boolean
  onRemoveProgramHistories: (ids: string[]) => void
  /** 실 API 모드 — 삭제 API 없음 */
  deleteDisabled?: boolean
  totalCount?: number
  loading?: boolean
}

/**
 * 후원사 상세 LNB의 “프로그램 진행 이력” 탭 본문입니다.
 */
export function SponsorProgramHistoryPanel({
  pendingFilters,
  filteredRows,
  selectedKeys,
  setSelectedKeys,
  handleFilterChange,
  handleSearch,
  columns,
  canWrite,
  onRemoveProgramHistories,
  deleteDisabled = false,
  totalCount,
  loading = false,
}: SponsorProgramHistoryPanelProps) {
  const navigate = useNavigate()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedModalOpen, setDeleteBlockedModalOpen] = useState(false)

  const selectedRows = useMemo((): SponsorProgramHistoryRow[] => {
    const keySet = new Set(selectedKeys.map(k => String(k)))
    return filteredRows.filter(row => keySet.has(row.id))
  }, [filteredRows, selectedKeys])

  const deleteGuide = useMemo(() => {
    return buildProgramProgressHistoryDeleteGuide(
      selectedRows.map(r => (r.title?.trim() ? r.title.trim() : '(제목 없음)'))
    )
  }, [selectedRows])

  const rowSelection = useMemo((): TableRowSelection<SponsorProgramHistoryRow> | undefined => {
    if (!canWrite) return undefined
    return {
      columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
      selectedRowKeys: selectedKeys,
      onChange: setSelectedKeys,
      preserveSelectedRowKeys: false,
    }
  }, [canWrite, selectedKeys, setSelectedKeys])

  const handleDeleteProgramHistory = useCallback((): void => {
    if (!canWrite || selectedKeys.length === 0 || deleteDisabled) return
    setDeleteModalOpen(true)
  }, [canWrite, deleteDisabled, selectedKeys.length])

  const handleDeleteCancel = useCallback((): void => {
    setDeleteModalOpen(false)
  }, [])

  const handleDeleteConfirm = useCallback((): void => {
    const ids = selectedKeys.map(k => String(k))
    if (ids.length === 0) return

    const hasInProgress = selectedRows.some(row =>
      isProgramHistoryDeleteBlockedByDisplayStatus(
        getEnrollmentDisplayStatusFromProgramLifecycle(row.lifecycleStatus)
      )
    )
    if (hasInProgress) {
      setDeleteModalOpen(false)
      setDeleteBlockedModalOpen(true)
      return
    }

    onRemoveProgramHistories(ids)
    setSelectedKeys([])
    setDeleteModalOpen(false)
  }, [onRemoveProgramHistories, selectedKeys, selectedRows, setSelectedKeys])

  const programHistoryTableOnRow = useCallback(
    (record: SponsorProgramHistoryRow) => ({
      onClick: (e: MouseEvent<HTMLElement>) => {
        const el = e.target as HTMLElement
        if (
          el.closest('.ant-table-selection-column') ||
          el.closest('.ant-checkbox-wrapper') ||
          el.closest('button') ||
          el.closest('a')
        ) {
          return
        }
        const programId = record.programId?.trim()
        if (!programId) return
        navigateToProgramAdminDetail(navigate, programId)
      },
      style: { cursor: 'pointer' as const },
    }),
    [navigate]
  )

  return (
    <>
      <FilterTableLayout
        bordered={false}
        fields={programHistoryFilterFields}
        filters={{
          title: pendingFilters.title,
          year: pendingFilters.year,
          lifecycleStatus: pendingFilters.lifecycleStatus,
          participantType: pendingFilters.participantType,
          educationTarget: pendingFilters.educationTarget,
          managerName: pendingFilters.managerName,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="프로그램 진행 이력"
        description={`총 ${(totalCount ?? filteredRows.length).toLocaleString()}건`}
        actions={
          <CmsButton
            variant="delete"
            onClick={handleDeleteProgramHistory}
            disabled={!canWrite || selectedKeys.length === 0 || deleteDisabled}
            title={deleteDisabled ? '실 API 연동 시 프로그램 진행 이력 삭제는 지원되지 않습니다.' : undefined}
          >
            이력 삭제
          </CmsButton>
        }
        excelExport={{
          columns,
          data: filteredRows,
        }}
      >
        <Table<SponsorProgramHistoryRow>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={filteredRows}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowSelection={rowSelection}
          onRow={programHistoryTableOnRow}
        />
      </FilterTableLayout>
      {deleteModalOpen && deleteGuide && (
        <DeleteGuideModal
          open
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteGuide.title}
          lines={deleteGuide.lines}
          confirmText="삭제"
          confirmVariant="delete"
          requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        />
      )}
      {deleteBlockedModalOpen ? (
        <ProgramHistoryDeleteBlockedModal
          open
          onClose={() => setDeleteBlockedModalOpen(false)}
        />
      ) : null}
    </>
  )
}
