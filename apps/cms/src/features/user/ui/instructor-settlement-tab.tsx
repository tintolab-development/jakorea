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
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementListRow,
} from '@/data/mock/instructor-member-settlements'
import { InstructorInvoiceModal } from './instructor-invoice-modal'
import {
  InstructorSettlementCalendarView,
  type SettlementCalendarEvent,
} from './instructor-settlement-calendar'
import '@/features/program/ui/detail-modal/applicants/applicants-detail.css'
import './instructor-settlement-tab.css'

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

export interface InstructorSettlementTabProps {
  instructorUserId: string
  instructorName: string
}

export function InstructorSettlementTab({
  instructorUserId,
  instructorName: _instructorName,
}: InstructorSettlementTabProps) {
  const [pendingFilters, setPendingFilters] = useState<Record<string, unknown>>({
    programName: '',
    institutionName: '',
    settlementStatus: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters)
  const [currentMonth, setCurrentMonth] = useState(() => dayjs('2026-01-01'))
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => dayjs('2026-01-01'))
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InstructorSettlementListRow | null>(null)

  const baseRows = useMemo(
    () => getInstructorSettlementRows(instructorUserId),
    [instructorUserId]
  )

  const monthRows = useMemo(
    () => filterRowsByMonth(baseRows, currentMonth),
    [baseRows, currentMonth]
  )

  const filteredRows = useMemo(() => {
    const programName = String(appliedFilters.programName ?? '').trim().toLowerCase()
    const institutionName = String(appliedFilters.institutionName ?? '').trim().toLowerCase()
    const status = appliedFilters.settlementStatus as string | undefined
    return monthRows.filter(r => {
      if (programName && !r.programName.toLowerCase().includes(programName)) return false
      if (institutionName && !r.institutionName.toLowerCase().includes(institutionName))
        return false
      if (status && status !== 'all' && r.status !== status) return false
      return true
    })
  }, [monthRows, appliedFilters])

  const summary = useMemo(() => summarizeSettlementRows(filteredRows), [filteredRows])

  const calendarEvents: SettlementCalendarEvent[] = useMemo(
    () => rowsToCalendarEvents(filteredRows),
    [filteredRows]
  )

  const openInvoice = useCallback((row: InstructorSettlementListRow) => {
    if (!row.detailAvailable) {
      message.warning('상세 내역을 확인할 수 없습니다.')
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
        width: 64,
        align: 'center',
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: true,
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 140,
        ellipsis: true,
      },
      {
        title: '강의 진행 일자',
        dataIndex: 'lectureDateDisplay',
        key: 'lectureDateDisplay',
        width: 200,
      },
      {
        title: '정산 현황',
        dataIndex: 'status',
        key: 'status',
        width: 160,
        align: 'center',
        render: (status: InstructorSettlementListRow['status']) => {
          const st = INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status]
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                background: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`,
              }}
            >
              {INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]}
            </span>
          )
        },
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'scheduledAmount',
        key: 'scheduledAmount',
        width: 140,
        align: 'right',
        render: (v: number) => `${v.toLocaleString()}원`,
      },
      {
        title: '산출 내역',
        key: 'detail',
        width: 120,
        align: 'center',
        render: (_: unknown, record) => (
          <AppButton
            variant="cancel"
            size="small"
            disabled={!record.detailAvailable}
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
    if (selectedRowKeys.length === 0) {
      message.info('다운로드할 행을 선택해 주세요.')
      return
    }
    message.success(`선택 ${selectedRowKeys.length}건 지급조서 다운로드는 추후 연동됩니다.`)
  }

  return (
    <div className="instructor-settlement-tab">
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
          paddingLeft: '24px',
          marginBottom: 0,
          background: 'transparent',
        }}
      />

      <div className="applicant-details__divider-wrapper">
        <Divider />
      </div>

      <div className="instructor-settlement-tab__toolbar">
        <div className="instructor-settlement-tab__month-nav">
          <span className="instructor-settlement-tab__month-label">
            {currentMonth.format('YYYY. MM')}
          </span>
          <Button
            type="text"
            size="small"
            icon={<LeftOutlined />}
            onClick={() => {
              const n = currentMonth.subtract(1, 'month')
              setCurrentMonth(n)
              setCalendarSelectedDate(n.date(1))
            }}
            aria-label="이전 달"
          />
          <Button
            type="text"
            size="small"
            icon={<RightOutlined />}
            onClick={() => {
              const n = currentMonth.add(1, 'month')
              setCurrentMonth(n)
              setCalendarSelectedDate(n.date(1))
            }}
            aria-label="다음 달"
          />
        </div>
        <div className="instructor-settlement-tab__toolbar-actions">
          {viewMode === 'list' ? (
            <AppButton
              variant="cancel"
              size="filter-wide"
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('calendar')}
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

      <div className="instructor-settlement-tab__summary-row">
        <div className="instructor-settlement-tab__summary-card">
          <span className="instructor-settlement-tab__summary-label">총 정산 완료금</span>
          <span className="instructor-settlement-tab__summary-value">
            {summary.totalCompleted.toLocaleString()}원
          </span>
        </div>
        <div className="instructor-settlement-tab__summary-card">
          <span className="instructor-settlement-tab__summary-label">
            {currentMonth.format('M')}월 정산 완료금
          </span>
          <span className="instructor-settlement-tab__summary-value">
            {summary.monthCompleted.toLocaleString()}원
          </span>
        </div>
        <div className="instructor-settlement-tab__summary-card">
          <span className="instructor-settlement-tab__summary-label">정산 예정금</span>
          <span className="instructor-settlement-tab__summary-value instructor-settlement-tab__summary-value--mint">
            {summary.scheduled.toLocaleString()}원
          </span>
        </div>
      </div>

      <div className="instructor-settlement-tab__content">
        {viewMode === 'list' ? (
          <>
            <div className="instructor-settlement-tab__table-header">
              <div>
                <span className="instructor-settlement-tab__table-title">정산 목록</span>
                <span className="instructor-settlement-tab__table-meta">{filteredRows.length}건</span>
              </div>
            </div>
            <Table<InstructorSettlementListRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              size="middle"
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
              onMonthStep={delta => {
                const n = currentMonth.add(delta, 'month')
                setCurrentMonth(n)
                setCalendarSelectedDate(n.date(1))
              }}
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
