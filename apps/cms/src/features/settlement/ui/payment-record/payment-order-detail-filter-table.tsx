/**
 * 지급 현황 상세 — 프로그램 기준 강사별 / 강사 기준 프로그램별 정산 목록(필터·테이블)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { message, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import {
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import {
  deriveAggregateFromLines,
  formatWon,
  lineStatusSelectOptions,
  matchesDateRange,
  resolveDetailInitialDateRange,
  type AppliedLineStatus,
} from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import { renderLineProcessingStatusText } from '@/pages/settlement-management/payment-order-detail-aggregate-status'
import { PaymentOrderLectureDateSessionCell } from './payment-order-lecture-date-session-cell'
import { PaymentOrderBatchConfirmModal } from './payment-order-batch-confirm-modal'
import { Divider } from '@/shared/components/divider'
import { InstructorPaymentStatementBlockedModal } from '@/features/user/detail/ui/instructor-payment-statement-blocked-modal'
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
      /** 목록 페이지에 조회 적용된 기간(URL) — 상세 기간 필터 초기 동기화 */
      listPageDateRange: [Dayjs, Dayjs] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminProgramDetailInstructorRow) => void
    }
  | {
      mode: 'instructor'
      instructorRow: PaymentOrderAdminInstructorRow
      isOpen: boolean
      listPageDateRange: [Dayjs, Dayjs] | null
      onAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
      onOpenCalculationStatement: (row: PaymentOrderAdminInstructorDetailProgramRow) => void
    }

export function PaymentOrderDetailFilterTable(props: PaymentOrderDetailFilterTableProps) {
  const { mode, isOpen, listPageDateRange, onAggregateChange, onOpenCalculationStatement } = props

  const contextRowNo = mode === 'program' ? props.programRow.no : props.instructorRow.no

  const [draftKeyword, setDraftKeyword] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(() =>
    resolveDetailInitialDateRange(listPageDateRange)
  )
  const [applied, setApplied] = useState<DetailAppliedFilters>({
    keyword: '',
    institutionName: '',
    status: 'all',
    dateRange: resolveDetailInitialDateRange(listPageDateRange),
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [rowsState, setRowsState] = useState<PaymentOrderDetailLineRow[]>([])
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [paymentStatementIssueBlocked, setPaymentStatementIssueBlocked] = useState<{
    open: boolean
    variant: 'single' | 'multi'
    selectedCount: number
  }>({ open: false, variant: 'single', selectedCount: 0 })

  useEffect(() => {
    if (!isOpen) {
      setBatchConfirmOpen(false)
      setPaymentStatementIssueBlocked({ open: false, variant: 'single', selectedCount: 0 })
      return
    }

    const initialDateRange = resolveDetailInitialDateRange(listPageDateRange)

    setDraftKeyword('')
    setDraftInstitutionName('')
    setDraftStatus('all')
    setDraftDateRange(initialDateRange)
    setApplied({
      keyword: '',
      institutionName: '',
      status: 'all',
      dateRange: initialDateRange,
    })
    setSelectedRowKeys([])
    setBatchConfirmOpen(false)
    setPaymentStatementIssueBlocked({ open: false, variant: 'single', selectedCount: 0 })

    if (mode === 'program') {
      const d = getMockPaymentOrderProgramDetail(props.programRow)
      setRowsState(d.instructorRows.map(r => ({ ...r })))
    } else {
      const d = getMockPaymentOrderInstructorDetail(props.instructorRow)
      setRowsState(d.programRows.map(r => ({ ...r })))
    }
  }, [isOpen, mode, contextRowNo, listPageDateRange])

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

  const handleBatchConfirm = useCallback(
    (scheduledDate: Dayjs) => {
      const iso = scheduledDate.format('YYYY-MM-DD')
      setRowsState(prev =>
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
      message.success('선택한 항목이 지급조서 확인 완료로 반영되었습니다.')
      setBatchConfirmOpen(false)
      setSelectedRowKeys([])
    },
    [selectedRowKeys]
  )

  const filteredRows = useMemo(
    () => filterDetailRows(rowsState, mode, applied),
    [rowsState, mode, applied]
  )

  const handlePaymentStatementIssue = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    const selected = rowsState.filter(r => selectedRowKeys.includes(r.id))
    if (selected.length === 0) return
    const hasNotConfirmed = selected.some(r => r.processingStatus !== 'confirmed')
    if (!hasNotConfirmed) {
      window.alert('준비 중입니다.')
      return
    }
    const n = selected.length
    if (n === 1) {
      setPaymentStatementIssueBlocked({ open: true, variant: 'single', selectedCount: 1 })
    } else {
      setPaymentStatementIssueBlocked({ open: true, variant: 'multi', selectedCount: n })
    }
  }, [rowsState, selectedRowKeys])

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
    /** 프로그램 별 정산 목록(강사 상세): 프로그램명·기관명 비중 조정, 버튼열·No·금액 타이트 */
    const w =
      mode === 'instructor'
        ? {
            no: 52,
            title: 312,
            institution: 136,
            lecture: 204,
            processing: 164,
            amount: 124,
            breakdown: 148,
          }
        : {
            no: 64,
            title: 120,
            institution: 160,
            lecture: 220,
            processing: 176,
            amount: 140,
            breakdown: 196,
          }

    const nameColumn: ColumnsType<PaymentOrderDetailLineRow>[0] =
      mode === 'program'
        ? {
            title: '강사명',
            dataIndex: 'instructorName',
            key: 'instructorName',
            ellipsis: { showTitle: true },
            width: w.title,
            align: 'center',
          }
        : {
            title: '프로그램명',
            dataIndex: 'programName',
            key: 'programName',
            ellipsis: { showTitle: true },
            width: w.title,
            align: 'center',
          }

    return [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: w.no,
        align: 'center',
      },
      nameColumn,
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        width: w.institution,
        align: 'center',
      },
      {
        title: '강의 진행 일자',
        key: 'lecture',
        width: w.lecture,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <PaymentOrderLectureDateSessionCell
            lectureDate={row.lectureDate}
            sessionOrdinal={row.sessionOrdinal}
          />
        ),
      },
      {
        title: '지급 조서 처리 현황',
        key: 'processingStatus',
        width: w.processing,
        align: 'center',
        onCell: () => ({
          className: 'payment-order-detail-filter-table__td--processing-status',
        }),
        render: (_: unknown, row: PaymentOrderDetailLineRow) =>
          renderLineProcessingStatusText(row.processingStatus),
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: w.amount,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        width: w.breakdown,
        align: 'center',
        render: (_: unknown, row: PaymentOrderDetailLineRow) => (
          <AppButton
            variant="default"
            size="large"
            className={
              mode === 'instructor'
                ? 'payment-order-detail-filter-table__breakdown-btn--140x40'
                : 'payment-order-detail-filter-table__breakdown-btn--180'
            }
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
  }, [mode, onOpenCalculationStatement])

  const sectionTitle = mode === 'program' ? '강사 별 정산 목록' : '프로그램 별 정산 목록'

  const filterClassName =
    mode === 'program'
      ? 'payment-order-detail-filter-table__filters'
      : 'payment-order-detail-filter-table__filters participating-institutions-section__filters'

  return (
    <div className="payment-order-detail-filter-table">
      <PaymentOrderBatchConfirmModal
        open={batchConfirmOpen}
        onCancel={() => setBatchConfirmOpen(false)}
        selectedCount={selectedRowKeys.length}
        onConfirm={handleBatchConfirm}
      />
      <InstructorPaymentStatementBlockedModal
        open={paymentStatementIssueBlocked.open}
        onClose={() => setPaymentStatementIssueBlocked(prev => ({ ...prev, open: false }))}
        variant={paymentStatementIssueBlocked.variant}
        selectedCount={paymentStatementIssueBlocked.selectedCount}
        layout="detailFullpage"
      />
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

      <div
        className="payment-order-detail-filter-table__section-divider-wrap"
        aria-hidden
      >
        <Divider />
      </div>

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
              onClick={() => {
                if (selectedRowKeys.length === 0) return
                setBatchConfirmOpen(true)
              }}
            >
              일괄 확인
            </AppButton>
            <AppButton
              variant="primary"
              size="filter-wide"
              icon={<DownloadOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handlePaymentStatementIssue}
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
