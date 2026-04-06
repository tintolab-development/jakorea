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
import { UnifiedFilterCard, type FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import {
  getInstructorSettlementRows,
  filterRowsByMonth,
  summarizeSettlementRows,
  rowsToCalendarEvents,
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import { InstructorPaymentStatusBadge } from '@/shared/components/instructor-payment-status-badge'
import { InstructorInvoiceModal } from './instructor-invoice-modal'
import {
  InstructorSettlementCalendarView,
  type SettlementCalendarEvent,
} from './instructor-settlement-calendar'
import '@/features/program/ui/detail-modal/applicants/applicants-detail.css'
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

  const baseRows = useMemo(() => getInstructorSettlementRows(instructorUserId), [instructorUserId])

  const monthRows = useMemo(
    () => filterRowsByMonth(baseRows, currentMonth),
    [baseRows, currentMonth]
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
    () => summarizeSettlementRows(filteredRows, { allRowsForTotal: baseRows }),
    [filteredRows, baseRows]
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
          <div className="instructor-payment-tab__status-badge-wrap">
            <InstructorPaymentStatusBadge status={status} />
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
          <AppButton
            variant="viewDetails"
            size="large"
            disabled={record.status === 'none'}
            onClick={() => openInvoice(record)}
          >
            상세 보기
          </AppButton>
        ),
      },
    ],
    [openInvoice]
  )

  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters })
  }

  const handleBulkDownload = () => {
    window.alert('준비 중입니다.')
    if (selectedRowKeys.length === 0) {
      message.info('다운로드할 행을 선택해 주세요.')
      return
    }
    message.success(`선택 ${selectedRowKeys.length}건 지급조서 다운로드는 추후 연동됩니다.`)
  }

  return (
    <div className="instructor-payment-tab">
      <UnifiedFilterCard
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
          <div className="program-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              className="program-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              className="program-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="instructor-payment-tab__toolbar-actions">
          {viewMode === 'list' ? (
            <AppButton
              variant="cancel"
              size="filter-wide"
              icon={<CalendarOutlined />}
              onClick={goToCalendarView}
            >
              캘린더 뷰로 보기
            </AppButton>
          ) : (
            <AppButton
              variant="cancel"
              size="filter-wide"
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            >
              리스트 뷰로 보기
            </AppButton>
          )}
          <AppButton
            variant="primary"
            size="filter-wide"
            icon={<DownloadOutlined />}
            onClick={handleBulkDownload}
          >
            지급조서 다운로드
          </AppButton>
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
          <span className="instructor-payment-tab__summary-label">정산 예정금</span>
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
              className="cms-data-table cms-data-table--fluid"
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
            />
          </>
        ) : (
          <div className="applicant-calendar-view-container">
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
      />
    </div>
  )
}
