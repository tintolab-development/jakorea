/**
 * 지급 현황 상세 — 프로그램 기준 강사별 / 강사 기준 프로그램별 정산 목록(필터·테이블)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { PaymentOrderLineProcessingStatusBadge } from '@/shared/components/payment-order-line-processing-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminLineProcessingStatus,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  defaultDateRange,
  deriveAggregateFromLines,
  formatLectureCell,
  formatWon,
  lineStatusSelectOptions,
  LINE_STATUS_OPTIONS,
  matchesDateRange,
  type AppliedLineStatus,
} from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import './payment-order-detail-filter-table.css'

export type PaymentOrderDetailLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

interface DetailAppliedFilters {
  keyword: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

function filterDetailRows(
  rows: PaymentOrderDetailLineRow[],
  mode: 'program' | 'instructor',
  applied: DetailAppliedFilters
): PaymentOrderDetailLineRow[] {
  const keyword = applied.keyword.trim()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    if (keyword) {
      const keywordMatch =
        mode === 'program'
          ? (row as PaymentOrderAdminProgramDetailInstructorRow).instructorName.includes(keyword)
          : (row as PaymentOrderAdminInstructorDetailProgramRow).programName.includes(keyword)
      if (!keywordMatch) return false
    }
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

export type PaymentOrderDetailFilterTableProps =
  | {
      mode: 'program'
      programRow: PaymentOrderAdminProgramRow
      isOpen: boolean
      onAggregateChange: (status: PaymentOrderAdminProcessingStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
    }
  | {
      mode: 'instructor'
      instructorRow: PaymentOrderAdminInstructorRow
      isOpen: boolean
      onAggregateChange: (status: PaymentOrderAdminProcessingStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminInstructorDetailProgramRow) => void
    }

export function PaymentOrderDetailFilterTable(props: PaymentOrderDetailFilterTableProps) {
  const { mode, isOpen, onAggregateChange, onOpenCalculationStatement } = props

  const contextRowNo = mode === 'program' ? props.programRow.no : props.instructorRow.no

  const [draftKeyword, setDraftKeyword] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange)
  const [applied, setApplied] = useState<DetailAppliedFilters>({
    keyword: '',
    institutionName: '',
    status: 'all',
    dateRange: defaultDateRange,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [rowsState, setRowsState] = useState<PaymentOrderDetailLineRow[]>([])
  const [openStatusRowId, setOpenStatusRowId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setDraftKeyword('')
    setDraftInstitutionName('')
    setDraftStatus('all')
    setDraftDateRange(defaultDateRange)
    setApplied({
      keyword: '',
      institutionName: '',
      status: 'all',
      dateRange: defaultDateRange,
    })
    setSelectedRowKeys([])
    setOpenStatusRowId(null)

    if (mode === 'program') {
      const d = getMockPaymentOrderProgramDetail(props.programRow)
      setRowsState(d.instructorRows.map(r => ({ ...r })))
    } else {
      const d = getMockPaymentOrderInstructorDetail(props.instructorRow)
      setRowsState(d.programRows.map(r => ({ ...r })))
    }
  }, [isOpen, mode, contextRowNo])

  useEffect(() => {
    onAggregateChange(deriveAggregateFromLines(rowsState.map(r => r.processingStatus)))
  }, [rowsState, onAggregateChange])

  const handleSearch = useCallback(() => {
    setApplied({
      keyword: draftKeyword.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftInstitutionName, draftKeyword, draftStatus])

  const filteredRows = useMemo(
    () => filterDetailRows(rowsState, mode, applied),
    [rowsState, mode, applied]
  )

  const keywordFieldKey = mode === 'program' ? 'instructorName' : 'programName'

  const filterFields = useMemo(() => {
    const keywordField =
      mode === 'program'
        ? {
            key: 'instructorName' as const,
            type: 'search' as const,
            label: '강사명',
            placeholder: '강사명을 입력하세요',
            width: '23%',
          }
        : {
            key: 'programName' as const,
            type: 'search' as const,
            label: '프로그램명',
            placeholder: '프로그램명을 입력하세요',
            flex: '1 1 0',
          }

    const institutionField =
      mode === 'program'
        ? {
            key: 'institutionName' as const,
            type: 'search' as const,
            label: '참여 기관명',
            placeholder: '기관명을 입력하세요',
            width: '23%',
          }
        : {
            key: 'institutionName' as const,
            type: 'search' as const,
            label: '참여 기관명',
            placeholder: '기관명을 입력하세요',
            flex: '1 1 0',
          }

    const statusField =
      mode === 'program'
        ? {
            key: 'status' as const,
            type: 'select' as const,
            label: '지급조서 처리 현황',
            placeholder: '전체',
            options: lineStatusSelectOptions.filter(o => o.value !== 'all'),
            allowClear: true,
            width: '23%',
          }
        : {
            key: 'status' as const,
            type: 'select' as const,
            label: '지급조서 처리 현황',
            placeholder: '전체',
            options: lineStatusSelectOptions.filter(o => o.value !== 'all'),
            allowClear: true,
            flex: '1 1 0',
          }

    const dateField =
      mode === 'program'
        ? {
            key: 'dateRange' as const,
            type: 'dateRange' as const,
            label: '기간',
            width: '31%',
          }
        : {
            key: 'dateRange' as const,
            type: 'dateRange' as const,
            label: '기간',
            flex: '1 1 0',
          }

    return [keywordField, institutionField, statusField, dateField]
  }, [mode])

  const filterFilters = useMemo(
    () => ({
      [keywordFieldKey]: draftKeyword,
      institutionName: draftInstitutionName,
      status: draftStatus === 'all' ? undefined : draftStatus,
      dateRange: draftDateRange,
    }),
    [draftDateRange, draftInstitutionName, draftKeyword, draftStatus, keywordFieldKey]
  )

  const columns: ColumnsType<PaymentOrderDetailLineRow> = useMemo(() => {
    const nameColumn: ColumnsType<PaymentOrderDetailLineRow>[0] =
      mode === 'program'
        ? {
            title: '강사명',
            dataIndex: 'instructorName',
            key: 'instructorName',
            ellipsis: { showTitle: true },
            width: 120,
            align: 'center',
          }
        : {
            title: '프로그램명',
            dataIndex: 'programName',
            key: 'programName',
            ellipsis: { showTitle: true },
            width: 280,
            align: 'center',
          }

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      nameColumn,
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        width: 160,
        align: 'center',
      },
      {
        title: '강의 진행 일자',
        key: 'lecture',
        width: 220,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) =>
          formatLectureCell(row.lectureDate, row.sessionOrdinal),
      },
      {
        title: '지급 조서 처리 현황',
        key: 'processingStatus',
        width: 176,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <>
            <StatusDropdownCell<PaymentOrderAdminLineProcessingStatus>
              status={row.processingStatus}
              statusOptions={LINE_STATUS_OPTIONS}
              style={{ width: '160px' }}
              renderBadge={s => <PaymentOrderLineProcessingStatusBadge status={s} detailLabels />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => {
                setRowsState(prev =>
                  prev.map(r => (r.id === row.id ? { ...r, processingStatus: newStatus } : r))
                )
              }}
              isOpen={openStatusRowId === row.id}
              onOpenChange={nextOpen => setOpenStatusRowId(nextOpen ? row.id : null)}
            />
          </>
        ),
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 140,
        align: 'center',
        render: (amount: number, row: PaymentOrderDetailLineRow) =>
          row.processingStatus === 'rejected' ? '-' : formatWon(amount),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        width: 196,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <AppButton
            variant="default"
            size="large"
            style={{ width: '180px' }}
            onClick={e => {
              e.stopPropagation()
              if (mode === 'program') {
                onOpenCalculationStatement(row as PaymentOrderAdminProgramDetailInstructorRow)
              } else {
                onOpenCalculationStatement(row as PaymentOrderAdminInstructorDetailProgramRow)
              }
            }}
          >
            상세 보기
          </AppButton>
        ),
      },
    ]
  }, [mode, onOpenCalculationStatement, openStatusRowId])

  const sectionTitle =
    mode === 'program' ? '강사 별 정산 목록' : '프로그램 별 정산 목록'

  const filterClassName =
    mode === 'program'
      ? 'payment-order-detail-filter-table__filters'
      : 'payment-order-detail-filter-table__filters participating-institutions-section__filters'

  return (
    <div className="payment-order-detail-filter-table">
      <div className={filterClassName}>
        <UnifiedFilterCard
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={filterFields}
          filters={filterFilters}
          onFilterChange={(key, value) => {
            if (key === keywordFieldKey) {
              setDraftKeyword(value as string)
              return
            }
            if (key === 'institutionName') {
              setDraftInstitutionName(value as string)
              return
            }
            if (key === 'status') {
              setDraftStatus((value ?? 'all') as AppliedLineStatus)
              return
            }
            if (key === 'dateRange') {
              setDraftDateRange(value as [Dayjs, Dayjs] | null)
            }
          }}
          onSearch={handleSearch}
        />
      </div>

      <div className="payment-order-detail-filter-table__section-divider" />

      <div className="payment-order-detail-filter-table__below-divider participating-institutions-section__below-divider">
        <div className="participating-institutions-section__table-header">
          <div className="participating-institutions-section__table-heading">
            <span className="participating-institutions-section__table-title">{sectionTitle}</span>
            <span className="participating-institutions-section__table-description">
              총 {filteredRows.length}건
            </span>
          </div>
          <div className="participating-institutions-section__table-actions">
            <AppButton
              variant="cancel"
              size="filter"
              disabled={selectedRowKeys.length === 0}
              onClick={() => window.alert('준비 중입니다.')}
            >
              일괄 확인
            </AppButton>
            <AppButton
              variant="primary"
              size="filter-wide"
              icon={<DownloadOutlined />}
              onClick={() => window.alert('준비 중입니다.')}
            >
              지급조서 발급
            </AppButton>
          </div>
        </div>

        <Table<PaymentOrderDetailLineRow>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
          }}
        />
      </div>
    </div>
  )
}
