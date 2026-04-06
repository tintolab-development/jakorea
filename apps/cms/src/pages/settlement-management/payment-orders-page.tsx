/**
 * 정산 관리 > 지급조서 확인 — 프로그램별·강사별 정산 목록
 * 필터·테이블 헤더·버튼: 프로그램 상세 풀페이지 모달 내 참여기관 UI와 동일 구조·스타일 (기존 컴포넌트·CSS 재사용)
 */

import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDER_ADMIN_STATUS_LABELS,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-order-admin-status-tag.css'
import './payment-orders-page.css'
import { PaymentOrdersCalendarView } from './payment-orders-calendar-view'
import { PaymentOrderDetailFullPageModal } from './payment-order-detail-fullpage-modal'

type ExposureMode = 'program' | 'instructor'

type PageViewMode = 'list' | 'calendar'

type AppliedStatus = 'all' | PaymentOrderAdminProcessingStatus

interface AppliedFilters {
  programName: string
  status: AppliedStatus
  dateRange: [Dayjs, Dayjs] | null
}

const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-08-01'), dayjs('2026-06-30')]

const statusSelectOptions: { value: AppliedStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  ...(Object.keys(PAYMENT_ORDER_ADMIN_STATUS_LABELS) as PaymentOrderAdminProcessingStatus[]).map(
    key => ({
      value: key,
      label: PAYMENT_ORDER_ADMIN_STATUS_LABELS[key],
    })
  ),
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
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${status}`}
    >
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
          <div className="participating-institutions-section__filters">
            <UnifiedFilterCard
              bordered={false}
              cardStyle={{ marginBottom: 0 }}
              fields={[
                {
                  key: 'exposureMode',
                  type: 'radio',
                  label: '노출 기준',
                  options: [
                    { label: '프로그램별', value: 'program' },
                    { label: '강사별', value: 'instructor' },
                  ],
                  width: 188,
                },
                {
                  key: 'programName',
                  type: 'search',
                  label: '프로그램명',
                  placeholder: '프로그램명을 입력하세요',
                  width: '20%',
                },
                {
                  key: 'status',
                  type: 'select',
                  label: '지급조서 처리 현황',
                  placeholder: '전체',
                  options: statusSelectOptions.filter(o => o.value !== 'all'),
                  allowClear: true,
                  width: '20%',
                },
                {
                  key: 'dateRange',
                  type: 'dateRange',
                  label: '기간',
                  width: '30%',
                },
              ]}
              filters={{
                exposureMode,
                programName: draftProgramName,
                status: draftStatus === 'all' ? undefined : draftStatus,
                dateRange: draftDateRange,
              }}
              onFilterChange={(key, value) => {
                if (key === 'exposureMode') {
                  setExposureMode(value as ExposureMode)
                  return
                }
                if (key === 'programName') {
                  setDraftProgramName(value as string)
                  return
                }
                if (key === 'status') {
                  setDraftStatus((value ?? 'all') as AppliedStatus)
                  return
                }
                if (key === 'dateRange') {
                  setDraftDateRange(value as [Dayjs, Dayjs] | null)
                }
              }}
              onSearch={handleSearch}
            />
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

            <div className="participating-institutions-section__table-wrap">
              {viewMode === 'calendar' ? (
                <PaymentOrdersCalendarView
                  key={`${appliedResetKey}-${exposureMode}`}
                  exposure={exposureMode}
                  programRows={listProgram}
                  instructorRows={listInstructor}
                  onPaymentStatusDetailClick={payload => {
                    if (payload.exposure === 'program') {
                      setSelectedProgramForDetail(payload.row)
                      setProgramStatusDetailOpen(true)
                    } else {
                      setSelectedInstructorForDetail(payload.row)
                      setInstructorStatusDetailOpen(true)
                    }
                  }}
                />
              ) : isProgram ? (
                <Table<PaymentOrderAdminProgramRow>
                  className="cms-data-table cms-data-table--fluid"
                  columns={programColumns}
                  dataSource={listProgram}
                  pagination={false}
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
                  className="cms-data-table cms-data-table--fluid"
                  rowKey="no"
                  columns={instructorColumns}
                  dataSource={listInstructor}
                  pagination={false}
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

      <PaymentOrderDetailFullPageModal
        type="program"
        isOpen={programStatusDetailOpen}
        onClose={() => {
          setProgramStatusDetailOpen(false)
          setSelectedProgramForDetail(null)
        }}
        data={selectedProgramForDetail}
      />

      <PaymentOrderDetailFullPageModal
        type="instructor"
        isOpen={instructorStatusDetailOpen}
        onClose={() => {
          setInstructorStatusDetailOpen(false)
          setSelectedInstructorForDetail(null)
        }}
        data={selectedInstructorForDetail}
      />
    </div>
  )
}
