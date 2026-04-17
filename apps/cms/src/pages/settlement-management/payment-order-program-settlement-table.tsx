/**
 * 지급 현황 상세 — 프로그램 기준 강사별 정산 목록(필터·테이블)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, message } from 'antd'
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
  getMockPaymentOrderProgramDetail,
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
} from './payment-order-detail-fullpage-shared'

interface ProgramDetailAppliedFilters {
  instructorName: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

function filterInstructorDetailRows(
  rows: PaymentOrderAdminProgramDetailInstructorRow[],
  applied: ProgramDetailAppliedFilters
): PaymentOrderAdminProgramDetailInstructorRow[] {
  const qInstructor = applied.instructorName.trim()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    if (qInstructor && !row.instructorName.includes(qInstructor)) return false
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

export interface PaymentOrderProgramSettlementTableProps {
  programRow: PaymentOrderAdminProgramRow
  isOpen: boolean
  onAggregateChange: (status: PaymentOrderAdminProcessingStatus) => void
  onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
}

export function PaymentOrderProgramSettlementTable({
  programRow,
  isOpen,
  onAggregateChange,
  onOpenCalculationStatement,
}: PaymentOrderProgramSettlementTableProps) {
  const [draftInstructorName, setDraftInstructorName] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange)
  const [applied, setApplied] = useState<ProgramDetailAppliedFilters>({
    instructorName: '',
    institutionName: '',
    status: 'all',
    dateRange: defaultDateRange,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [instructorRowsState, setInstructorRowsState] = useState<
    PaymentOrderAdminProgramDetailInstructorRow[]
  >([])
  const [openStatusRowId, setOpenStatusRowId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && programRow) {
      setDraftInstructorName('')
      setDraftInstitutionName('')
      setDraftStatus('all')
      setDraftDateRange(defaultDateRange)
      setApplied({
        instructorName: '',
        institutionName: '',
        status: 'all',
        dateRange: defaultDateRange,
      })
      setSelectedRowKeys([])
      const d = getMockPaymentOrderProgramDetail(programRow)
      setInstructorRowsState(d.instructorRows.map(r => ({ ...r })))
      setOpenStatusRowId(null)
    }
  }, [isOpen, programRow.no])

  useEffect(() => {
    onAggregateChange(deriveAggregateFromLines(instructorRowsState.map(r => r.processingStatus)))
  }, [instructorRowsState, onAggregateChange])

  const handleSearch = useCallback(() => {
    setApplied({
      instructorName: draftInstructorName.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftInstitutionName, draftInstructorName, draftStatus])

  const filteredRows = useMemo(
    () => filterInstructorDetailRows(instructorRowsState, applied),
    [instructorRowsState, applied]
  )

  const columns: ColumnsType<PaymentOrderAdminProgramDetailInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        ellipsis: { showTitle: true },
        width: 120,
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
        title: '강의 진행 일자',
        key: 'lecture',
        width: 220,
        align: 'center',
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) =>
          formatLectureCell(row.lectureDate, row.sessionOrdinal),
      },
      {
        title: '지급 조서 처리 현황',
        key: 'processingStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<PaymentOrderAdminLineProcessingStatus>
              status={row.processingStatus}
              statusOptions={LINE_STATUS_OPTIONS}
              renderBadge={s => <PaymentOrderLineProcessingStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => {
                setInstructorRowsState(prev =>
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
        title: '정산 예정 금액',
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
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) => (
          <AppButton
            variant="default"
            size="small"
            className="payment-order-program-status-detail__detail-btn"
            onClick={e => {
              e.stopPropagation()
              onOpenCalculationStatement(row)
            }}
          >
            상세 보기
          </AppButton>
        ),
      },
    ],
    [onOpenCalculationStatement, openStatusRowId]
  )

  return (
    <>
      <div className="payment-order-program-status-detail__filters">
        <UnifiedFilterCard
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={[
            {
              key: 'instructorName',
              type: 'search',
              label: '강사명',
              placeholder: '강사명을 입력하세요',
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
            instructorName: draftInstructorName,
            institutionName: draftInstitutionName,
            status: draftStatus === 'all' ? undefined : draftStatus,
            dateRange: draftDateRange,
          }}
          onFilterChange={(key, value) => {
            if (key === 'instructorName') {
              setDraftInstructorName(value as string)
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

      <div className="participating-institutions-section__divider payment-order-program-status-detail__section-divider" />

      <div className="payment-order-program-status-detail__below-divider participating-institutions-section__below-divider">
        <div className="participating-institutions-section__table-header">
          <div className="participating-institutions-section__table-heading">
            <span className="participating-institutions-section__table-title">
              강사 별 정산 목록
            </span>
            <span className="participating-institutions-section__table-description">
              총 {filteredRows.length}건
            </span>
          </div>
          <div className="participating-institutions-section__table-actions">
            <AppButton
              variant="cancel"
              size="filter-wide"
              disabled={selectedRowKeys.length === 0}
              onClick={() => message.info('일괄 확인은 추후 연결됩니다.')}
            >
              일괄 확인
            </AppButton>
            <AppButton
              variant="primary"
              size="filter-wide"
              icon={<DownloadOutlined />}
              onClick={() => message.info('지급조서 다운로드는 추후 연결됩니다.')}
            >
              지급조서 다운로드
            </AppButton>
          </div>
        </div>

        <div className="payment-order-program-status-detail__table-wrap participating-institutions-section__table-wrap">
          <Table<PaymentOrderAdminProgramDetailInstructorRow>
            className="cms-data-table cms-data-table--fluid"
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
    </>
  )
}
