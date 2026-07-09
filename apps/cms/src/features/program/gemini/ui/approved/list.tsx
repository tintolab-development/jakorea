import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { DELETE_GUIDE_TYPED_CONFIRM_VALUE } from '@/shared/constants/delete-guide-modal'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { CmsButton, DeleteGuideModal, useCmsAlert } from '@/shared/ui'
import { geminiApprovedTrainingService } from '../../api/approved-training-service'
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
import {
  resolveApprovedTrainingFilterDate,
  resolveApprovedTrainingStatus,
} from '../../lib/approved/resolve-status'
import { useGeminiApprovedTrainingRows } from '../../hooks/use-gemini-approved-training-rows'
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
import { useGeminiApprovedTrainingDetailUrl } from './detail-fullpage-modal'
import '@/pages/programs/program-list-page.css'
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

function filterRows(
  rows: GeminiApprovedTrainingRow[],
  filters: PendingFilters,
  todayKey: string
) {
  const institutionNameQ = filters.institutionName.trim().toLowerCase()
  const referenceDate = dayjs(todayKey)

  return rows.filter(row => {
    if (institutionNameQ && !row.institutionName.toLowerCase().includes(institutionNameQ)) {
      return false
    }
    if (filters.institutionSido && row.institutionSido !== filters.institutionSido) {
      return false
    }
    if (filters.institutionSigungu && row.institutionSigungu !== filters.institutionSigungu) {
      return false
    }
    const derivedStatus = resolveApprovedTrainingStatus(row, referenceDate)
    if (filters.status !== 'ALL' && derivedStatus !== filters.status) {
      return false
    }
    if (filters.officialDocumentRequired !== 'ALL') {
      const required = filters.officialDocumentRequired === 'Y'
      if (row.officialDocumentRequired !== required) return false
    }
    if (filters.trainingDateRange?.[0] && filters.trainingDateRange[1]) {
      const rowDate = dayjs(resolveApprovedTrainingFilterDate(row))
      const from = filters.trainingDateRange[0].startOf('day')
      const to = filters.trainingDateRange[1].endOf('day')
      if (!rowDate.isValid() || rowDate.isBefore(from) || rowDate.isAfter(to)) {
        return false
      }
    }
    return true
  })
}

export function GeminiApprovedTrainingList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const { openDetail } = useGeminiApprovedTrainingDetailUrl()
  const todayKey = useToday()
  const allRows = useGeminiApprovedTrainingRows()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)

  const filteredRows = useMemo(
    () => filterRows(allRows, appliedFilters, todayKey),
    [allRows, appliedFilters, todayKey]
  )

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
    setDeleteModalOpen(true)
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const handleConfirmDelete = useCallback(() => {
    geminiApprovedTrainingService.delete(selectedRowKeys.map(key => String(key)))
    setSelectedRowKeys([])
    setDeleteModalOpen(false)
  }, [selectedRowKeys])

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
      <FilterTableLayout
        bordered={false}
        className="gemini-approved-training-list"
        filterResponsiveWrap={false}
        multiRowGridMode="responsive"
        multiRowResponsiveLayout="merged-auto-fill"
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
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        actions={
          <>
            <CmsButton variant="delete" disabled={!canWrite} onClick={handleBulkDeleteClick}>
              선택 삭제
            </CmsButton>
          </>
        }
        excelExport={{
          columns: GEMINI_APPROVED_TRAINING_EXCEL_COLUMNS,
          data: excelRows,
        }}
      >
        <Table<GeminiApprovedTrainingRow>
          rowKey="id"
          className="cms-data-table gemini-approved-training-list__table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
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
      </FilterTableLayout>

      <DeleteGuideModal
        open={deleteModalOpen}
        title="선택 삭제"
        lines={[
          `선택한 ${selectedRowKeys.length}건의 승인 연수를 삭제하시겠습니까?`,
          '삭제된 승인 연수는 복구할 수 없습니다.',
        ]}
        confirmText="삭제"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
