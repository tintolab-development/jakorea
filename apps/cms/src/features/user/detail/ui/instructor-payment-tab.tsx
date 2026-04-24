import { useState, useMemo, useCallback } from 'react'
import { Divider, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CalendarOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Button } from 'antd'
import { TableFilterGroup, type FilterFieldConfig } from '@/shared/components/table-filter-group'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  getInstructorSettlementRows,
  filterRowsByMonth,
  summarizeSettlementRows,
  rowsToCalendarEvents,
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  type InstructorSettlementListRow,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import { InstructorInvoiceModal } from './modal/instructor-invoice-modal'
import { InstructorPaymentStatementBlockedModal } from './modal/instructor-payment-statement-blocked-modal'
import {
  InstructorSettlementCalendarView,
  type SettlementCalendarEvent,
} from './instructor-settlement-calendar'
import '@/features/program/program-detail/ui/applicant-list/applicant-list.css'
import './instructor-payment-tab.css'

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'programName',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    flex: 1,
  },
  {
    key: 'institutionName',
    type: 'search',
    label: '참여 기관명',
    placeholder: '기관명을 입력하세요',
    flex: 1,
  },
  {
    key: 'settlementStatus',
    type: 'select',
    label: '정산 현황',
    placeholder: '전체',
    options: INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
    allowClear: true,
    flex: 1,
  },
]

/** 테이블 정산 현황 열 — 텍스트 색만 (status-badge.css instructor-settlement 톤과 동일) */
const SETTLEMENT_TABLE_STATUS_CLASS: Record<InstructorSettlementUiStatus, string> = {
  awaiting_confirmation: 'instructor-payment-tab__settlement-text--awaiting',
  partial_confirmation: 'instructor-payment-tab__settlement-text--partial',
  payment_statement_verified: 'instructor-payment-tab__settlement-text--statement-verified',
  account_paid: 'instructor-payment-tab__settlement-text--account-paid',
  none: 'instructor-payment-tab__settlement-text--na',
  application_rejected: 'instructor-payment-tab__settlement-text--rejected',
  payment_correction_requested: 'instructor-payment-tab__settlement-text--correction',
}

export interface InstructorPaymentTabProps {
  instructorUserId: string
  instructorName: string
}

export function InstructorPaymentTab({
  instructorUserId,
  instructorName: _instructorName,
}: InstructorPaymentTabProps) {
  const [pendingFilters, setPendingFilters] = useState<Record<string, unknown>>({
    programName: '',
    institutionName: '',
    settlementStatus: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters)
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => dayjs())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InstructorSettlementListRow | null>(null)
  const [confirmedStatementRowIds, setConfirmedStatementRowIds] = useState<Set<string>>(
    () => new Set()
  )
  const [paymentStatementBlockedModal, setPaymentStatementBlockedModal] = useState<{
    open: boolean
    variant: 'single' | 'multi'
    selectedCount: number
  }>({ open: false, variant: 'single', selectedCount: 0 })

  const baseRows = useMemo(() => getInstructorSettlementRows(instructorUserId), [instructorUserId])
  const effectiveRows = useMemo(
    () =>
      baseRows.map(row => {
        if (!confirmedStatementRowIds.has(row.id) || row.status === 'account_paid') return row
        return {
          ...row,
          status: 'payment_statement_verified' as const,
          invoice: {
            ...row.invoice,
            paymentStatementStatus: 'payment_statement_verified' as const,
          },
        }
      }),
    [baseRows, confirmedStatementRowIds]
  )

  const monthRows = useMemo(
    () => filterRowsByMonth(effectiveRows, currentMonth),
    [effectiveRows, currentMonth]
  )

  const handlePrev = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'))
  }

  const handleNext = () => {
    setCurrentMonth(prev => prev.add(1, 'month'))
  }
  const filteredRows = useMemo(() => {
    const programName = String(appliedFilters.programName ?? '')
      .trim()
      .toLowerCase()
    const institutionName = String(appliedFilters.institutionName ?? '')
      .trim()
      .toLowerCase()
    const status = appliedFilters.settlementStatus as string | undefined
    return monthRows.filter(r => {
      if (programName && !r.programName.toLowerCase().includes(programName)) return false
      if (institutionName && !r.institutionName.toLowerCase().includes(institutionName))
        return false
      if (status && status !== 'all' && r.status !== status) return false
      return true
    })
  }, [monthRows, appliedFilters])

  const summary = useMemo(
    () => summarizeSettlementRows(filteredRows, { allRowsForTotal: effectiveRows }),
    [filteredRows, effectiveRows]
  )

  const calendarEvents: SettlementCalendarEvent[] = useMemo(
    () => rowsToCalendarEvents(filteredRows),
    [filteredRows]
  )

  const goToCalendarView = useCallback(() => {
    const today = dayjs()
    setCurrentMonth(today.startOf('month'))
    setCalendarSelectedDate(today)
    setViewMode('calendar')
  }, [])

  const openInvoice = useCallback((row: InstructorSettlementListRow) => {
    if (row.status === 'none') {
      message.warning('정산 현황이 없어 상세 내역을 확인할 수 없습니다.')
      return
    }
    setInvoiceData(row)
    setInvoiceOpen(true)
  }, [])

  const columns: ColumnsType<InstructorSettlementListRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        align: 'center',
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
      },
      {
        title: '강의 진행 일자',
        dataIndex: 'lectureDateDisplay',
        key: 'lectureDateDisplay',
        minWidth: 250,
      },
      {
        title: '정산 현황',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        minWidth: 180,
        render: (status: InstructorSettlementListRow['status']) => (
          <div className="instructor-payment-tab__settlement-status-cell">
            <span
              className={`instructor-payment-tab__settlement-text ${SETTLEMENT_TABLE_STATUS_CLASS[status]}`}
            >
              {INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]}
            </span>
          </div>
        ),
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'scheduledAmount',
        key: 'scheduledAmount',
        align: 'center',
        render: (v: number) => `${v.toLocaleString()}원`,
      },
      {
        title: '산출 내역',
        key: 'detail',
        align: 'center',
        render: (_: unknown, record) => (
          <div className="instructor-payment-tab__detail-action-cell">
            <CmsButton
              variant="default"
              size="medium"
              disabled={record.status === 'none'}
              onClick={() => openInvoice(record)}
            >
              상세 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [openInvoice]
  )

  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters })
  }

  const handleBulkDownload = useCallback(() => {
    window.alert('준비 중입니다.')
  }, [])

  return (
    <div
      className={[
        'instructor-payment-tab',
        viewMode === 'calendar' ? 'instructor-payment-tab--calendar-fill' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TableFilterGroup
        fields={FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={(key, value) =>
          setPendingFilters(prev => ({
            ...prev,
            [key]: value,
          }))
        }
        onSearch={handleSearch}
        bordered={false}
        cardStyle={{
          padding: '0 34px',
          marginBottom: 0,
          background: 'transparent',
        }}
      />

      <div className="instructor-payment-tab__divider-wrapper">
        <Divider style={{ margin: 0 }} />
      </div>

      <div className="instructor-payment-tab__toolbar">
        <div className="instructor-payment-tab__month-nav">
          <span className="instructor-payment-tab__month-label">
            {currentMonth.format('YYYY. MM')}
          </span>
          <div className="calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              className="calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              className="calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="instructor-payment-tab__toolbar-actions">
          {viewMode === 'list' ? (
            <CmsButton
              variant="secondary"
              size="large"
              width="auto"
              style={{ minWidth: 180 }}
              icon={<CalendarOutlined />}
              onClick={goToCalendarView}
            >
              캘린더 뷰로 보기
            </CmsButton>
          ) : (
            <CmsButton
              variant="secondary"
              size="large"
              width="auto"
              style={{ minWidth: 180 }}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            >
              리스트 뷰로 보기
            </CmsButton>
          )}
          <CmsButton
            variant="primary"
            size="large"
            width="auto"
            style={{ minWidth: 180 }}
            icon={<DownloadOutlined />}
            onClick={handleBulkDownload}
          >
            지급조서 발급
          </CmsButton>
        </div>
      </div>

      <div className="instructor-payment-tab__summary-row">
        <div className="instructor-payment-tab__summary-card">
          <span className="instructor-payment-tab__summary-label">총 정산 완료금</span>
          <span className="instructor-payment-tab__summary-value">
            {summary.totalCompleted.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
          </span>
        </div>
        <div className="instructor-payment-tab__summary-card">
          <span className="instructor-payment-tab__summary-label">
            {currentMonth.format('M')}월 정산 완료금
          </span>
          <span className="instructor-payment-tab__summary-value">
            {summary.monthCompleted.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
          </span>
        </div>
        <div className="instructor-payment-tab__summary-card">
          <span className="instructor-payment-tab__summary-label">
            {currentMonth.format('M')}월 정산 예정금
          </span>
          <span className="instructor-payment-tab__summary-value instructor-payment-tab__summary-value--mint">
            {summary.scheduled.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
          </span>
        </div>
      </div>

      <div className="instructor-payment-tab__content">
        {viewMode === 'list' ? (
          <>
            <Table<InstructorSettlementListRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className="cms-data-table cms-data-table--fluid"
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
            />
          </>
        ) : (
          <div className="instructor-payment-tab__calendar-view-container instructor-payment-tab__calendar-view-container--no-inner-scroll">
            <InstructorSettlementCalendarView
              events={calendarEvents}
              currentMonth={currentMonth}
              onDisplayMonthChange={setCurrentMonth}
              selectedDate={calendarSelectedDate}
              onSelectedDateChange={setCalendarSelectedDate}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onSettlementClick={openInvoice}
            />
          </div>
        )}
      </div>

      <InstructorInvoiceModal
        open={invoiceOpen}
        onClose={() => {
          setInvoiceOpen(false)
          setInvoiceData(null)
        }}
        data={invoiceData?.invoice ?? null}
        settlementLineRowId={invoiceData?.id ?? null}
        instructorNameKo={invoiceData?.instructorName?.trim() || _instructorName.trim() || '강사'}
        onPaymentStatementConfirmed={rowId => {
          setConfirmedStatementRowIds(prev => {
            const next = new Set(prev)
            next.add(rowId)
            return next
          })
          setInvoiceData(prev => {
            if (!prev || prev.id !== rowId || prev.status === 'account_paid') return prev
            return {
              ...prev,
              status: 'payment_statement_verified',
              invoice: {
                ...prev.invoice,
                paymentStatementStatus: 'payment_statement_verified',
              },
            }
          })
        }}
      />

      <InstructorPaymentStatementBlockedModal
        open={paymentStatementBlockedModal.open}
        onClose={() => setPaymentStatementBlockedModal(prev => ({ ...prev, open: false }))}
        variant={paymentStatementBlockedModal.variant}
        selectedCount={paymentStatementBlockedModal.selectedCount}
      />
    </div>
  )
}
