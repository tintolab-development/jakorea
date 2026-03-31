/**
 * 정산 관리 > 지급조서 확인 — 프로그램별·강사별 정산 목록
 * 필터·테이블 헤더·버튼: 프로그램 상세 풀페이지 모달 내 참여기관 UI와 동일 구조·스타일 (기존 컴포넌트·CSS 재사용)
 */

import { useCallback, useMemo, useState } from 'react'
import { Col, DatePicker, Input, Radio, Row, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { AppButton } from '@/shared/ui/app-button'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDER_ADMIN_STATUS_LABELS,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/participating-institutions-section.css'
import '@/features/program/ui/program-progress-tab.css'
import './payment-order-admin-status-tag.css'
import './payment-orders-page.css'
import { PaymentOrdersCalendarView } from './payment-orders-calendar-view'
import { PaymentOrderInstructorStatusDetailFullPageModal } from './payment-order-instructor-status-detail-fullpage-modal'
import { PaymentOrderProgramStatusDetailFullPageModal } from './payment-order-program-status-detail-fullpage-modal'

type ExposureMode = 'program' | 'instructor'

type PageViewMode = 'list' | 'calendar'

type AppliedStatus = 'all' | PaymentOrderAdminProcessingStatus

interface AppliedFilters {
  programName: string
  status: AppliedStatus
  dateRange: [Dayjs, Dayjs] | null
}

const DATE_DISPLAY_FORMAT = 'YYYY. MM. DD'

const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-08-01'), dayjs('2026-06-30')]

const statusSelectOptions: { value: AppliedStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  ...(
    Object.keys(PAYMENT_ORDER_ADMIN_STATUS_LABELS) as PaymentOrderAdminProcessingStatus[]
  ).map(key => ({
    value: key,
    label: PAYMENT_ORDER_ADMIN_STATUS_LABELS[key],
  })),
]

function matchesDateRange(referenceDate: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range[1]) return true
  const d = dayjs(referenceDate)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

function filterProgramRows(
  rows: PaymentOrderAdminProgramRow[],
  applied: AppliedFilters
): PaymentOrderAdminProgramRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.programName.includes(q)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.referenceDate, applied.dateRange)) return false
    return true
  })
}

function filterInstructorRows(
  rows: PaymentOrderAdminInstructorRow[],
  applied: AppliedFilters
): PaymentOrderAdminInstructorRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.relatedProgramNames.some(name => name.includes(q))) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.referenceDate, applied.dateRange)) return false
    return true
  })
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function renderProcessingStatusCell(status: PaymentOrderAdminProcessingStatus) {
  return (
    <span className={`payment-order-admin__status-text payment-order-admin__status-text--${status}`}>
      {PAYMENT_ORDER_ADMIN_STATUS_LABELS[status]}
    </span>
  )
}

export default function PaymentOrdersPage() {
  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [exposureMode, setExposureMode] = useState<ExposureMode>('program')
  const [draftProgramName, setDraftProgramName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange)
  const [applied, setApplied] = useState<AppliedFilters>({
    programName: '',
    status: 'all',
    dateRange: defaultDateRange,
  })
  const [programStatusDetailOpen, setProgramStatusDetailOpen] = useState(false)
  const [selectedProgramForDetail, setSelectedProgramForDetail] =
    useState<PaymentOrderAdminProgramRow | null>(null)
  const [instructorStatusDetailOpen, setInstructorStatusDetailOpen] = useState(false)
  const [selectedInstructorForDetail, setSelectedInstructorForDetail] =
    useState<PaymentOrderAdminInstructorRow | null>(null)
  const appliedResetKey = useMemo(
    () =>
      [
        applied.programName,
        applied.status,
        applied.dateRange?.[0]?.valueOf() ?? '',
        applied.dateRange?.[1]?.valueOf() ?? '',
      ].join('|'),
    [applied]
  )

  const filteredPrograms = useMemo(
    () => filterProgramRows(mockPaymentOrderAdminProgramList, applied),
    [applied]
  )

  const filteredInstructors = useMemo(
    () => filterInstructorRows(mockPaymentOrderAdminInstructorList, applied),
    [applied]
  )

  const handleSearch = useCallback(() => {
    setApplied({
      programName: draftProgramName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftProgramName, draftStatus])

  const programColumns: ColumnsType<PaymentOrderAdminProgramRow> = useMemo(
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
        ellipsis: { showTitle: true },
        width: 360,
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상 강사 수',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: 152,
        align: 'center',
        render: (n: number) => `${n}명`,
      },
      {
        title: '지급조서 처리 현황',
        dataIndex: 'processingStatus',
        key: 'processingStatus',
        width: 200,
        align: 'center',
        render: (s: PaymentOrderAdminProcessingStatus) => renderProcessingStatusCell(s),
      },
      {
        title: '정산 예정금',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 168,
        align: 'center',
        render: (amount: number, record: PaymentOrderAdminProgramRow) =>
          record.processingStatus === 'rejected' ? '-' : formatWon(amount),
      },
    ],
    []
  )

  const instructorColumns: ColumnsType<PaymentOrderAdminInstructorRow> = useMemo(
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
        width: 140,
        minWidth: 120,
        align: 'center',
      },
      {
        title: '정산 대상 프로그램 수',
        dataIndex: 'programCount',
        key: 'programCount',
        width: 168,
        align: 'center',
        render: (n: number) => `${n}개`,
      },
      {
        title: '지급조서 처리 현황',
        dataIndex: 'processingStatus',
        key: 'processingStatus',
        width: 200,
        align: 'center',
        render: (s: PaymentOrderAdminProcessingStatus) => renderProcessingStatusCell(s),
      },
      {
        title: '정산 예정금',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 168,
        align: 'center',
        render: (amount: number, record: PaymentOrderAdminInstructorRow) =>
          record.processingStatus === 'rejected' ? '-' : formatWon(amount),
      },
    ],
    []
  )

  const isProgram = exposureMode === 'program'
  const listProgram = filteredPrograms
  const listInstructor = filteredInstructors
  const total = isProgram ? listProgram.length : listInstructor.length

  return (
    <div className="payment-orders-page">
      <div className="payment-orders-page__content-wrapper">
        <div className="participating-institutions-section">
          <div className="participating-institutions-section__filters program-progress-tab__filters">
            <Row
              gutter={[0, 0]}
              align="bottom"
              wrap={false}
              className="program-progress-tab__filter-row"
            >
              <Col flex="0 0 auto" className="program-progress-tab__filter-col">
                <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top payment-orders-page__filter-stack">
                  <span className="program-progress-tab__filter-label">노출 기준</span>
                  <Radio.Group value={exposureMode} onChange={e => setExposureMode(e.target.value)}>
                    <Radio value="program">프로그램별</Radio>
                    <Radio value="instructor">강사별</Radio>
                  </Radio.Group>
                </div>
              </Col>
              <Col flex="0 0 auto" className="program-progress-tab__filter-col">
                <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top payment-orders-page__filter-stack">
                  <span className="program-progress-tab__filter-label">프로그램명</span>
                  <Input
                    placeholder="프로그램명을 입력하세요"
                    value={draftProgramName}
                    onChange={e => setDraftProgramName(e.target.value)}
                    allowClear
                    className="participating-institutions-section__filter-input"
                  />
                </div>
              </Col>
              <Col flex="0 0 auto" className="program-progress-tab__filter-col">
                <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top payment-orders-page__filter-stack">
                  <span className="program-progress-tab__filter-label">지급조서 처리 현황</span>
                  <Select<AppliedStatus>
                    placeholder="전체"
                    value={draftStatus === 'all' ? undefined : draftStatus}
                    onChange={v => setDraftStatus((v ?? 'all') as AppliedStatus)}
                    allowClear
                    options={statusSelectOptions.filter(o => o.value !== 'all')}
                    getPopupContainer={() => document.body}
                  />
                </div>
              </Col>
              <Col flex="0 0 auto" className="program-progress-tab__filter-col">
                <div className="program-progress-tab__filter-field participating-institutions-section__filter-field--label-top payment-orders-page__filter-stack">
                  <span className="program-progress-tab__filter-label">기간</span>
                  <DatePicker.RangePicker
                    className="payment-orders-page__range-picker"
                    value={draftDateRange}
                    onChange={dates =>
                      setDraftDateRange(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null)
                    }
                    format={DATE_DISPLAY_FORMAT}
                    allowClear
                    getPopupContainer={() => document.body}
                  />
                </div>
              </Col>
              <Col flex="none" className="program-progress-tab__filter-col--btn">
                <div className="payment-orders-page__filter-btn-slot">
                  <AppButton variant="primary" size="filter" onClick={handleSearch}>
                    조회
                  </AppButton>
                </div>
              </Col>
            </Row>
          </div>

          <div className="participating-institutions-section__divider" />

          <div className="participating-institutions-section__below-divider">
            <div className="participating-institutions-section__table-header">
              <div
                className={
                  viewMode === 'calendar'
                    ? 'participating-institutions-section__table-heading payment-orders-page__calendar-heading'
                    : 'participating-institutions-section__table-heading'
                }
              >
                {viewMode === 'calendar' ? (
                  <>
                    <span className="payment-orders-page__calendar-title">
                      {isProgram ? '프로그램 별 정산 목록' : '강사별 정산 목록'}
                    </span>
                    <span className="payment-orders-page__calendar-description">총 {total}건</span>
                  </>
                ) : (
                  <>
                    <span className="participating-institutions-section__table-title">
                      {isProgram ? '프로그램 별 정산 목록' : '강사별 정산 목록'}
                    </span>
                    <span className="participating-institutions-section__table-description">
                      총 {total}건
                    </span>
                  </>
                )}
              </div>
              <div className="participating-institutions-section__table-actions">
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
              </div>
            </div>

            <div className="participating-institutions-section__table-wrap payment-orders-page__table-scroll-root">
              {viewMode === 'calendar' ? (
                <PaymentOrdersCalendarView
                  key={`${appliedResetKey}-${exposureMode}`}
                  exposure={exposureMode}
                  programRows={listProgram}
                  instructorRows={listInstructor}
                />
              ) : isProgram ? (
                <Table<PaymentOrderAdminProgramRow>
                  className="participating-institutions-section__table participating-institutions-section__table--clickable payment-orders-page__table"
                  rowKey="no"
                  columns={programColumns}
                  dataSource={listProgram}
                  pagination={false}
                  size="middle"
                  tableLayout="fixed"
                  scroll={{ x: 1000 }}
                  onRow={record => ({
                    onClick: () => {
                      setSelectedProgramForDetail(record)
                      setProgramStatusDetailOpen(true)
                    },
                    style: { cursor: 'pointer' },
                  })}
                />
              ) : (
                <Table<PaymentOrderAdminInstructorRow>
                  className="participating-institutions-section__table participating-institutions-section__table--clickable payment-orders-page__table"
                  rowKey="no"
                  columns={instructorColumns}
                  dataSource={listInstructor}
                  pagination={false}
                  size="middle"
                  tableLayout="fixed"
                  scroll={{ x: 820 }}
                  onRow={record => ({
                    onClick: () => {
                      setSelectedInstructorForDetail(record)
                      setInstructorStatusDetailOpen(true)
                    },
                    style: { cursor: 'pointer' },
                  })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentOrderProgramStatusDetailFullPageModal
        open={programStatusDetailOpen}
        onClose={() => {
          setProgramStatusDetailOpen(false)
          setSelectedProgramForDetail(null)
        }}
        programRow={selectedProgramForDetail}
      />

      <PaymentOrderInstructorStatusDetailFullPageModal
        open={instructorStatusDetailOpen}
        onClose={() => {
          setInstructorStatusDetailOpen(false)
          setSelectedInstructorForDetail(null)
        }}
        instructorRow={selectedInstructorForDetail}
      />
    </div>
  )
}
