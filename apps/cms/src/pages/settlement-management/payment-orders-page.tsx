/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터: FilterTableLayout(TableFilterGroup) · 헤더·뷰 전환: ViewModeController (참여기관 섹션과 동일 패턴)
 */

import { useCallback, useEffect, useMemo, useState, type ReactElement, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { ViewModeController } from '@/shared/components/view-mode'
import '@/shared/components/list-page/list-page-layout.css'
import type { ViewModeToggleOption } from '@/shared/components/view-mode'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDER_STATUS_LABELS_DETAIL,
  PAYMENT_ORDER_STATUS_LABELS_LIST,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/features/program/ui/detail-modal/program-status/program-progress-tab.css'
import './payment-order-admin-status-tag.css'
import './payment-orders-page.css'
import {
  PaymentOrdersCalendarView,
  PaymentOrdersTable,
} from '@/features/settlement/ui/payment-record'
import { PaymentOrderDetailFullPageModal } from './payment-order-detail-fullpage-modal'
import { AppButton } from '@/shared/ui/app-button'

type ExposureMode = 'program' | 'instructor'

type PageViewMode = 'list' | 'calendar'

const paymentOrdersViewModeOptions = [
  { value: 'list' as const, label: '리스트 뷰로 보기', icon: <UnorderedListOutlined /> },
  { value: 'calendar' as const, label: '캘린더 뷰로 보기', icon: <CalendarOutlined /> },
] satisfies readonly ViewModeToggleOption<PageViewMode>[]

type DetailState =
  | { type: 'program'; data: PaymentOrderAdminProgramRow }
  | { type: 'instructor'; data: PaymentOrderAdminInstructorRow }
  | null

type AppliedStatus = 'all' | PaymentOrderAdminProcessingStatus

interface AppliedFilters {
  programName: string
  status: AppliedStatus
  dateRange: [Dayjs, Dayjs] | null
}

/** 선택열(≈60) + 데이터 열 합(64+360+152+200+168) — 프로그램/강사 테이블 동일 스크롤 폭 */
const PAYMENT_ORDERS_LIST_TABLE_SCROLL_X = 60 + 64 + 360 + 152 + 200 + 168

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

function renderProcessingStatusCell(
  status: PaymentOrderAdminProcessingStatus,
  labels: Record<PaymentOrderAdminProcessingStatus, string>
) {
  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${status}`}
    >
      {labels[status]}
    </span>
  )
}

export default function PaymentOrdersPage() {
  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [exposureMode, setExposureMode] = useState<ExposureMode>('program')
  const [draftProgramName, setDraftProgramName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [applied, setApplied] = useState<AppliedFilters>({
    programName: '',
    status: 'all',
    dateRange: null,
  })
  const [detailState, setDetailState] = useState<DetailState>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  /** 캘린더 뷰 우측 패널 체크 — 일괄 확인과 연동 */
  const [calendarRightPanelSelectedKeys, setCalendarRightPanelSelectedKeys] = useState<Key[]>([])

  const statusSelectOptions = useMemo((): { value: AppliedStatus; label: string }[] => {
    const labels =
      exposureMode === 'program'
        ? PAYMENT_ORDER_STATUS_LABELS_LIST
        : PAYMENT_ORDER_STATUS_LABELS_DETAIL
    return [
      { value: 'all', label: '전체' },
      ...(Object.keys(labels) as PaymentOrderAdminProcessingStatus[]).map(key => ({
        value: key,
        label: labels[key],
      })),
    ]
  }, [exposureMode])

  const closeDetail = useCallback(() => {
    setDetailState(null)
  }, [])
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
    setSelectedRowKeys([])
    setCalendarRightPanelSelectedKeys([])
  }, [draftDateRange, draftProgramName, draftStatus])

  useEffect(() => {
    setSelectedRowKeys([])
    setCalendarRightPanelSelectedKeys([])
  }, [exposureMode, appliedResetKey, viewMode])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: Key[]) => setSelectedRowKeys(keys),
    }),
    [selectedRowKeys]
  )

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
        render: (s: PaymentOrderAdminProcessingStatus) =>
          renderProcessingStatusCell(s, PAYMENT_ORDER_STATUS_LABELS_LIST),
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
        width: 360,
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상 프로그램 수',
        dataIndex: 'programCount',
        key: 'programCount',
        width: 152,
        align: 'center',
        render: (n: number) => `${n}개`,
      },
      {
        title: '지급조서 처리 현황',
        dataIndex: 'processingStatus',
        key: 'processingStatus',
        width: 200,
        align: 'center',
        render: (s: PaymentOrderAdminProcessingStatus) =>
          renderProcessingStatusCell(s, PAYMENT_ORDER_STATUS_LABELS_LIST),
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

  const isTableRowKeySelected = useCallback(
    (rowNo: number) => {
      return selectedRowKeys.some(k => k === rowNo || String(k) === String(rowNo))
    },
    [selectedRowKeys]
  )

  const handleBatchConfirm = useCallback(() => {
    if (viewMode === 'list') {
      if (isProgram) {
        const rows = listProgram.filter(r => isTableRowKeySelected(r.no))
        window.alert(`일괄 확인: 프로그램 ${rows.length}건 (준비 중입니다.)`)
        return
      }
      const rows = listInstructor.filter(r => isTableRowKeySelected(r.no))
      window.alert(`일괄 확인: 강사 ${rows.length}건 (준비 중입니다.)`)
      return
    }
    const keySet = new Set(calendarRightPanelSelectedKeys.map(String))
    if (isProgram) {
      const rows = listProgram.filter(r => keySet.has(`program-${r.no}`))
      window.alert(`일괄 확인: 프로그램 ${rows.length}건 (준비 중입니다.)`)
      return
    }
    const rows = listInstructor.filter(r => keySet.has(`instructor-${r.no}`))
    window.alert(`일괄 확인: 강사 ${rows.length}건 (준비 중입니다.)`)
  }, [
    viewMode,
    isProgram,
    listProgram,
    listInstructor,
    isTableRowKeySelected,
    calendarRightPanelSelectedKeys,
  ])

  const renderHeader = (mode: PageViewMode): ReactElement => {
    const hasBatchSelection =
      mode === 'list' ? selectedRowKeys.length > 0 : calendarRightPanelSelectedKeys.length > 0
    return (
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">
            {isProgram ? '프로그램 별 정산 목록' : '강사 별 정산 목록'}
          </span>
          <span className="table-description">총 {total}건</span>
        </div>
        <div className="participating-institutions-section__table-actions">
          <AppButton
            variant="cancel"
            size="filter"
            disabled={!hasBatchSelection}
            onClick={handleBatchConfirm}
          >
            일괄 확인
          </AppButton>
        </div>
      </div>
    )
  }

  const renderContent = (mode: PageViewMode): ReactElement =>
    mode === 'calendar' ? (
      <PaymentOrdersCalendarView
        key={`${appliedResetKey}-${exposureMode}`}
        exposure={exposureMode}
        programRows={listProgram}
        instructorRows={listInstructor}
        rightPanelSelectedKeys={calendarRightPanelSelectedKeys}
        onRightPanelSelectedKeysChange={setCalendarRightPanelSelectedKeys}
        onPaymentStatusDetailClick={payload => {
          if (payload.exposure === 'program') {
            setDetailState({ type: 'program', data: payload.row })
          } else {
            setDetailState({ type: 'instructor', data: payload.row })
          }
        }}
      />
    ) : isProgram ? (
      <PaymentOrdersTable<PaymentOrderAdminProgramRow>
        key="payment-orders-program"
        rowKey="no"
        columns={programColumns}
        dataSource={listProgram}
        rowSelection={rowSelection}
        scroll={{ x: PAYMENT_ORDERS_LIST_TABLE_SCROLL_X }}
        onRowClick={record => setDetailState({ type: 'program', data: record })}
      />
    ) : (
      <PaymentOrdersTable<PaymentOrderAdminInstructorRow>
        key="payment-orders-instructor"
        rowKey="no"
        columns={instructorColumns}
        dataSource={listInstructor}
        rowSelection={rowSelection}
        scroll={{ x: PAYMENT_ORDERS_LIST_TABLE_SCROLL_X }}
        onRowClick={record => setDetailState({ type: 'instructor', data: record })}
      />
    )

  return (
    <>
      <FilterTableLayout
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
      >
        <div className="participating-institutions-section__below-divider">
          <ViewModeController<PageViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={paymentOrdersViewModeOptions}
            renderHeader={renderHeader}
            renderContent={mode => (
              <div className="list-page-layout__table-shell">{renderContent(mode)}</div>
            )}
          />
        </div>
      </FilterTableLayout>

      <PaymentOrderDetailFullPageModal
        type={detailState?.type ?? 'program'}
        isOpen={detailState !== null}
        onClose={closeDetail}
        data={detailState?.data ?? null}
      />
    </>
  )
}
