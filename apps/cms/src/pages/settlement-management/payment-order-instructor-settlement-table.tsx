/**
 * 지급 현황 상세 — 강사 기준 프로그램별 정산 목록(필터·테이블)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { PaymentOrderLineProcessingStatusBadge } from '@/shared/components/payment-order-line-processing-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  getMockPaymentOrderInstructorDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminLineProcessingStatus,
} from '@/data/mock/payment-order-admin-list'
import { PaymentOrderBatchConfirmModal } from '@/features/settlement/ui/payment-record/payment-order-batch-confirm-modal'
import { PaymentOrderLectureDateSessionCell } from '@/features/settlement/ui/payment-record/payment-order-lecture-date-session-cell'
import {
  defaultDateRange,
  deriveAggregateFromLines,
  formatWon,
  lineStatusSelectOptions,
  LINE_STATUS_OPTIONS,
  matchesDateRange,
  type AppliedLineStatus,
} from './payment-order-detail-fullpage-shared'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'

interface InstructorDetailAppliedFilters {
  programName: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

function filterInstructorProgramRows(
  rows: PaymentOrderAdminInstructorDetailProgramRow[],
  applied: InstructorDetailAppliedFilters
): PaymentOrderAdminInstructorDetailProgramRow[] {
  const qProgram = applied.programName.trim()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    if (qProgram && !row.programName.includes(qProgram)) return false
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

export interface PaymentOrderInstructorSettlementTableProps {
  instructorRow: PaymentOrderAdminInstructorRow
  isOpen: boolean
  onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
  onOpenCalculationStatement: (row: PaymentOrderAdminInstructorDetailProgramRow) => void
}

export function PaymentOrderInstructorSettlementTable({
  instructorRow,
  isOpen,
  onAggregateChange,
  onOpenCalculationStatement,
}: PaymentOrderInstructorSettlementTableProps) {
  const [draftProgramName, setDraftProgramName] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange)
  const [applied, setApplied] = useState<InstructorDetailAppliedFilters>({
    programName: '',
    institutionName: '',
    status: 'all',
    dateRange: defaultDateRange,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [programRowsState, setProgramRowsState] = useState<
    PaymentOrderAdminInstructorDetailProgramRow[]
  >([])
  const [openStatusRowId, setOpenStatusRowId] = useState<string | null>(null)
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen && instructorRow) {
      setDraftProgramName('')
      setDraftInstitutionName('')
      setDraftStatus('all')
      setDraftDateRange(defaultDateRange)
      setApplied({
        programName: '',
        institutionName: '',
        status: 'all',
        dateRange: defaultDateRange,
      })
      setSelectedRowKeys([])
      setBatchConfirmOpen(false)
      const d = getMockPaymentOrderInstructorDetail(instructorRow)
      setProgramRowsState(d.programRows.map(r => ({ ...r })))
      setOpenStatusRowId(null)
    }
  }, [isOpen, instructorRow.no])

  useEffect(() => {
    onAggregateChange(deriveAggregateFromLines(programRowsState.map(r => r.processingStatus)))
  }, [programRowsState, onAggregateChange])

  const handleSearch = useCallback(() => {
    setApplied({
      programName: draftProgramName.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftInstitutionName, draftProgramName, draftStatus])

  const handleBatchConfirm = useCallback(
    (scheduledDate: Dayjs) => {
      const iso = scheduledDate.format('YYYY-MM-DD')
      setProgramRowsState(prev =>
        prev.map(row =>
          selectedRowKeys.includes(row.id)
            ? {
                ...row,
                processingStatus: 'confirmed',
                lectureFeePaymentScheduledDate: iso,
              }
            : row
        )
      )
      setBatchConfirmOpen(false)
      setSelectedRowKeys([])
    },
    [selectedRowKeys]
  )

  const filteredRows = useMemo(
    () => filterInstructorProgramRows(programRowsState, applied),
    [programRowsState, applied]
  )

  const columns: ColumnsType<PaymentOrderAdminInstructorDetailProgramRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: { showTitle: true },
        width: 280,
        align: 'center',
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        width: 160,
        align: 'center',
      },
      {
        title: '교육 진행 일자',
        key: 'lecture',
        width: 220,
        align: 'center',
        render: (_: unknown, row: PaymentOrderAdminInstructorDetailProgramRow) => (
          <PaymentOrderLectureDateSessionCell
            lectureDate={row.lectureDate}
            sessionOrdinal={row.sessionOrdinal}
          />
        ),
      },
      {
        title: '지급조서 처리 현황',
        key: 'processingStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, row: PaymentOrderAdminInstructorDetailProgramRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<PaymentOrderAdminLineProcessingStatus>
              status={row.processingStatus}
              statusOptions={LINE_STATUS_OPTIONS}
              renderBadge={s => <PaymentOrderLineProcessingStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => {
                setProgramRowsState(prev =>
                  prev.map(r => (r.id === row.id ? { ...r, processingStatus: newStatus } : r))
                )
              }}
              isOpen={openStatusRowId === row.id}
              onOpenChange={nextOpen => setOpenStatusRowId(nextOpen ? row.id : null)}
            />
          </div>
        ),
      },
      {
        title: '정산 신청 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 140,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        width: 196,
        align: 'center',
        render: (_: unknown, row: PaymentOrderAdminInstructorDetailProgramRow) => (
          <CmsButton
            variant="default"
            size="small"
            className="payment-order-program-status-detail__detail-btn"
            onClick={e => {
              e.stopPropagation()
              onOpenCalculationStatement(row)
            }}
          >
            상세 보기
          </CmsButton>
        ),
      },
    ],
    [onOpenCalculationStatement, openStatusRowId]
  )

  return (
    <>
      <PaymentOrderBatchConfirmModal
        open={batchConfirmOpen}
        onCancel={() => setBatchConfirmOpen(false)}
        selectedCount={selectedRowKeys.length}
        onConfirm={handleBatchConfirm}
      />
      <FilterTableLayout
        className="payment-order-program-status-detail__filters"
        bordered={false}
        hideExcelDownload
        fields={[
          {
            key: 'programName',
            type: 'search',
            label: '프로그램명',
            placeholder: '프로그램명을 입력하세요',
            flex: '1 1 0',
          },
          {
            key: 'institutionName',
            type: 'search',
            label: '참여 기관명',
            placeholder: '기관명을 입력하세요',
            flex: '1 1 0',
          },
          {
            key: 'status',
            type: 'select',
            label: '지급조서 처리 현황',
            placeholder: '전체',
            options: lineStatusSelectOptions.filter(o => o.value !== 'all'),
            allowClear: true,
            flex: '1 1 0',
          },
          {
            key: 'dateRange',
            type: 'dateRange',
            label: '기간',
            flex: '1 1 0',
          },
        ]}
        filters={{
          programName: draftProgramName,
          institutionName: draftInstitutionName,
          status: draftStatus === 'all' ? undefined : draftStatus,
          dateRange: draftDateRange,
        }}
        onFilterChange={(key, value) => {
          if (key === 'programName') {
            setDraftProgramName(value as string)
            return
          }
          if (key === 'institutionName') {
            setDraftInstitutionName(value as string)
            return
          }
          if (key === 'status') {
            setDraftStatus((value == null || value === '' ? 'all' : value) as AppliedLineStatus)
            return
          }
          if (key === 'dateRange') {
            setDraftDateRange(value as [Dayjs, Dayjs] | null)
          }
        }}
        onSearch={handleSearch}
        title="프로그램 별 정산 목록"
        description={`총 ${filteredRows.length}건`}
        actions={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              style={{ minWidth: 180 }}
              disabled={selectedRowKeys.length === 0}
              onClick={() => {
                if (selectedRowKeys.length === 0) return
                setBatchConfirmOpen(true)
              }}
            >
              일괄 확인
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              onClick={() => {}}
            >
              지급조서 발급
            </CmsButton>
          </>
        }
      >
        <div className="payment-order-program-status-detail__table-wrap participating-institutions-section__table-wrap">
          <Table<PaymentOrderAdminInstructorDetailProgramRow>
            className="payment-order-program-status-detail__table participating-institutions-section__table cms-data-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredRows}
            pagination={false}
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1280 }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
          />
        </div>
      </FilterTableLayout>
    </>
  )
}
