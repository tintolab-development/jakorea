import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { GEMINI_APPROVED_TRAINING_FILTER_FIELDS } from '../../model/approved/filter-fields'
import { GEMINI_APPROVED_TRAINING_MOCK_ROWS } from '../../model/approved/mock'
import type {
  GeminiApprovedTrainingRow,
  GeminiApprovedTrainingStatus,
} from '../../model/approved/types'
import { useGeminiApprovedTrainingDetailUrl } from './detail-fullpage-modal'
import './list.css'

type PendingFilters = {
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  status: GeminiApprovedTrainingStatus | 'ALL'
  officialDocumentRequired: 'ALL' | 'Y' | 'N'
  trainingDateRange: [Dayjs | null, Dayjs | null] | null
}

const STATUS_LABEL: Record<GeminiApprovedTrainingStatus, string> = {
  SCHEDULED: '프로그램 진행 예정',
  IN_PROGRESS: '프로그램 진행 중',
  ENDED: '프로그램 진행 종료',
}
const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

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
  const modifier =
    status === 'SCHEDULED'
      ? `${base}--scheduled`
      : status === 'IN_PROGRESS'
        ? `${base}--in-progress`
        : `${base}--ended`
  return <span className={`${base} ${modifier}`}>{STATUS_LABEL[status]}</span>
}

function formatTrainingDatetime(row: GeminiApprovedTrainingRow): string {
  const x = dayjs(row.trainingDate)
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]}) | ${row.trainingTimeText}`
}

function filterRows(rows: GeminiApprovedTrainingRow[], filters: PendingFilters) {
  const institutionNameQ = filters.institutionName.trim().toLowerCase()
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
    if (filters.status !== 'ALL' && row.status !== filters.status) {
      return false
    }
    if (filters.officialDocumentRequired !== 'ALL') {
      const required = filters.officialDocumentRequired === 'Y'
      if (row.officialDocumentRequired !== required) return false
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

export function GeminiApprovedTrainingList() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const { openDetail } = useGeminiApprovedTrainingDetailUrl()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)

  const filteredRows = useMemo(
    () => filterRows(GEMINI_APPROVED_TRAINING_MOCK_ROWS, appliedFilters),
    [appliedFilters]
  )

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
    // TODO: 승인 연수 선택 삭제 확인 모달·API 연동
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

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
        render: (_: unknown, row) => `${row.institutionSido} ${row.institutionSigungu}`,
      },
      {
        title: '진행 현황',
        dataIndex: 'status',
        key: 'status',
        width: COL.status,
        align: 'center',
        render: (status: GeminiApprovedTrainingStatus) => statusText(status),
      },
      {
        title: '연수일시',
        key: 'trainingDatetime',
        width: COL.trainingDatetime,
        align: 'center',
        render: (_: unknown, row) => formatTrainingDatetime(row),
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
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
      },
      {
        title: '기관 담당자명',
        dataIndex: 'managerName',
        key: 'managerName',
        width: COL.managerName,
        align: 'center',
      },
    ],
    []
  )

  return (
    <FilterTableLayout
      bordered={false}
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
          <CmsButton variant="delete" disabled={!canWrite} onClick={handleBulkDelete}>
            선택 삭제
          </CmsButton>
        </>
      }
      excelExport={{
        columns,
        data: filteredRows,
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
  )
}
