import { useCallback, useMemo, useState, type Key } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { resolveFilterTableExcelFilename } from '@/shared/components/filter-table-excel-filename'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { GEMINI_PERFORMANCE_FILTER_FIELDS } from '../../model/performance/filter-fields'
import { createPerformanceMockRows } from '../../model/performance/mock'
import type {
  GeminiPerformanceRow,
  GeminiPerformanceTrainingMethod,
} from '../../model/performance/types'
import { useGeminiPerformanceReportAddUrl } from './report-add-fullpage-modal'
import '@/pages/programs/program-list-page.css'
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
  HYBRID: '혼합',
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  trainingLocation: 100,
  trainingDate: TABLE_COLUMN_WIDTHS.date,
  participantCount: 100,
  detailTimeText: 160,
  trainingHours: 100,
  trainingTopic: 200,
  instructorName: 100,
  assistantInstructorNames: 180,
  instructorCount: 100,
  trainingFormat: 150,
  trainingMethod: TABLE_COLUMN_WIDTHS.status,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
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

const INITIAL_PENDING_FILTERS: PendingFilters = {
  instructorName: '',
  trainingMethod: 'ALL',
  trainingLocation: '',
  trainingDateRange: null,
}

function formatTrainingDate(rawDate: string): string {
  return dayjs(rawDate).format('YYYY.M.D')
}

function filterRows(rows: GeminiPerformanceRow[], filters: PendingFilters) {
  const instructorQ = filters.instructorName.trim().toLowerCase()
  const locationQ = filters.trainingLocation.trim().toLowerCase()

  return rows.filter(row => {
    if (instructorQ) {
      const inMain = row.instructorName.toLowerCase().includes(instructorQ)
      const inAssist = row.assistantInstructorNames.toLowerCase().includes(instructorQ)
      if (!inMain && !inAssist) return false
    }
    if (filters.trainingMethod !== 'ALL' && row.trainingMethod !== filters.trainingMethod) {
      return false
    }
    if (locationQ && !row.trainingLocation.toLowerCase().includes(locationQ)) {
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
  const { openAdd } = useGeminiPerformanceReportAddUrl()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)

  const allRows = useMemo(() => createPerformanceMockRows(), [])

  const filteredRows = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
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
    // TODO: 연수 실적 선택 삭제 확인 모달·API 연동
  }, [canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const handleAddReport = useCallback(() => {
    if (!canWrite) return
    openAdd()
  }, [canWrite, openAdd])

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
      },
      {
        title: '세부시간',
        dataIndex: 'detailTimeText',
        key: 'detailTimeText',
        width: COL.detailTimeText,
        align: 'center',
      },
      {
        title: '연수시간',
        dataIndex: 'trainingHours',
        key: 'trainingHours',
        width: COL.trainingHours,
        align: 'center',
      },
      {
        title: '연수주제',
        dataIndex: 'trainingTopic',
        key: 'trainingTopic',
        width: COL.trainingTopic,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '강사',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
      },
      {
        title: '보조강사',
        dataIndex: 'assistantInstructorNames',
        key: 'assistantInstructorNames',
        width: COL.assistantInstructorNames,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '강사인원',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: COL.instructorCount,
        align: 'center',
      },
      {
        title: '연수 형태',
        dataIndex: 'trainingFormat',
        key: 'trainingFormat',
        width: COL.trainingFormat,
        align: 'center',
        ellipsis: { showTitle: true },
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

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns,
    data: filteredRows,
    filename: resolveFilterTableExcelFilename('전체 프로그램'),
  })

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        className="gemini-performance-list"
        filterResponsiveWrap={false}
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
              trainingMethod: (value == null ? 'ALL' : String(value)) as PendingFilters['trainingMethod'],
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
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        actions={
          <>
            <CmsButton variant="delete" disabled={!canWrite} onClick={handleBulkDelete}>
              선택 삭제
            </CmsButton>
            <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
            <CmsButton variant="primary" disabled={!canWrite} onClick={handleAddReport}>
              연수 보고서 등록
            </CmsButton>
          </>
        }
        hideExcelDownload
      >
        <Table<GeminiPerformanceRow>
          rowKey="id"
          className="cms-data-table gemini-performance-list__table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
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
    </div>
  )
}
