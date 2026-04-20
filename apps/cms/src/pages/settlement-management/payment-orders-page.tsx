/**
 * 정산 관리 > 지급조서 확인 페이지 — 프로그램별·강사별 정산 목록
 * 필터: FilterTableLayout(TableFilterGroup) · 헤더·뷰 전환: ViewModeController (참여기관 섹션과 동일 패턴)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { flushSync } from 'react-dom'
import type { Dayjs } from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { FilterFieldConfig } from '@/shared/components/table-filter-group'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { ViewModeController } from '@/shared/components/view-mode'
import '@/shared/components/list-page/list-page-layout.css'
import type { ViewModeToggleOption } from '@/shared/components/view-mode'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE,
  type PaymentOrderAdminInstructorRow,
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
import {
  createPaymentOrdersTablePageConfig,
  filterPaymentInstructorRows,
  filterPaymentProgramRows,
  parsePaymentOrdersFiltersFromUrl,
  type ExposureMode,
  type PendingPaymentItemBucket,
  type PaymentOrdersTableContext,
} from './payment-orders-table.config'

type PageViewMode = 'list' | 'calendar'

const paymentOrdersViewModeOptions = [
  { value: 'list' as const, label: '리스트 뷰로 보기', icon: <UnorderedListOutlined /> },
  { value: 'calendar' as const, label: '캘린더 뷰로 보기', icon: <CalendarOutlined /> },
] satisfies readonly ViewModeToggleOption<PageViewMode>[]

type DetailState =
  | { type: 'program'; data: PaymentOrderAdminProgramRow }
  | { type: 'instructor'; data: PaymentOrderAdminInstructorRow }
  | null

/** 데이터 열 합 — 행 선택 열 없음 */
const PAYMENT_ORDERS_LIST_SCROLL_X_PROGRAM = 64 + 360 + 180 + 200 + 168
const PAYMENT_ORDERS_LIST_SCROLL_X_INSTRUCTOR = 64 + 340 + 180 + 200 + 180

/** 지급대기 정산 항목 필터(전체는 선택 해제로 표현) */
const PENDING_PAYMENT_ITEM_FILTER_OPTIONS: {
  value: Exclude<PendingPaymentItemBucket, 'all'>
  label: string
}[] = [
  { value: 'none', label: '없음' },
  { value: '1-5', label: '1 ~ 5개' },
  { value: '6-10', label: '6 ~ 10개' },
  { value: '11plus', label: '11개 이상' },
]

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export default function PaymentOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<PageViewMode>('list')
  const [exposureMode, setExposureMode] = useState<ExposureMode>('program')
  const [detailState, setDetailState] = useState<DetailState>(null)

  /** 쿼리에 기간이 없을 때 목 mock 구간으로 채움(필터·캘린더·테이블이 동일 기준을 쓰도록) */
  const paymentOrdersDefaultRangeAppliedRef = useRef(false)

  const tablePageConfig = useMemo(() => createPaymentOrdersTablePageConfig(), [])

  useEffect(() => {
    const from = searchParams.get('po_from')
    const to = searchParams.get('po_to')
    /** 예전 목(2025 출강 구간)이 URL에 남아 있으면 새 목 구간으로 치환 */
    if (from && to && from.startsWith('2025-') && to.startsWith('2025-')) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('po_from', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.from)
        next.set('po_to', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.to)
        return next
      }, { replace: true })
      return
    }
    if (paymentOrdersDefaultRangeAppliedRef.current) return
    if (from && to) {
      paymentOrdersDefaultRangeAppliedRef.current = true
      return
    }
    if (!from && !to) {
      paymentOrdersDefaultRangeAppliedRef.current = true
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('po_from', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.from)
        next.set('po_to', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.to)
        return next
      }, { replace: true })
      return
    }
    paymentOrdersDefaultRangeAppliedRef.current = true
  }, [searchParams, setSearchParams])

  const appliedFromUrl = useMemo(
    () => parsePaymentOrdersFiltersFromUrl(searchParams),
    [searchParams]
  )

  const listProgram = useMemo(
    () => filterPaymentProgramRows(mockPaymentOrderAdminProgramList, appliedFromUrl),
    [appliedFromUrl]
  )
  const listInstructor = useMemo(
    () => filterPaymentInstructorRows(mockPaymentOrderAdminInstructorList, appliedFromUrl),
    [appliedFromUrl]
  )

  const isProgram = exposureMode === 'program'
  const rowsForTable = useMemo(
    () =>
      (isProgram ? listProgram : listInstructor) as (
        | PaymentOrderAdminProgramRow
        | PaymentOrderAdminInstructorRow
      )[],
    [isProgram, listProgram, listInstructor]
  )

  const tableContext = useMemo<PaymentOrdersTableContext>(
    () => ({
      setExposureMode,
    }),
    []
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    setPendingFilters,
  } = useTablePage(tablePageConfig, {
    data: rowsForTable,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  const closeDetail = useCallback(() => {
    setDetailState(null)
  }, [])

  /** 캘린더 헤더 네비·오늘·날짜 클릭 → 기간 필터·URL 동기화 (`applySearch`가 갱신된 pending을 읽도록 flushSync) */
  const applyDateRangeFromCalendar = useCallback(
    (range: [Dayjs, Dayjs]) => {
      flushSync(() => {
        setPendingFilters(prev => ({ ...prev, dateRange: range }))
      })
      handleSearch()
    },
    [handleSearch, setPendingFilters]
  )
  const appliedResetKey = useMemo(() => searchParams.toString(), [searchParams])

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
        title: '정산 대상 강사',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: 180,
        align: 'center',
        render: (n: number) => `${n}명`,
      },
      {
        title: '지급 대기 정산 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        width: 200,
        align: 'center',
        render: (count: number) => `${count}건`,
      },
      {
        title: '정산 예정금',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 168,
        align: 'center',
        render: (amount: number) => formatWon(amount),
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
        width: 340,
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상 프로그램 수',
        dataIndex: 'programCount',
        key: 'programCount',
        width: 180,
        align: 'center',
        render: (n: number) => `${n}개`,
      },
      {
        title: '지급 대기 정산 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        width: 200,
        align: 'center',
        render: (count: number) => `${count}건`,
      },
      {
        title: '정산 예정금',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 180,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
    ],
    []
  )

  const total = isProgram ? listProgram.length : listInstructor.length

  /** 한 줄 필터: 조회 버튼 제외 가로폭 기준 % 합계 100 (TableFilterGroup colFlex) */
  const paymentOrdersFilterFields = useMemo((): FilterFieldConfig[] => {
    const nameFilter: FilterFieldConfig = isProgram
      ? {
          key: 'programName',
          type: 'search',
          label: '프로그램명',
          placeholder: '프로그램명을 입력하세요',
          width: '24%',
        }
      : {
          key: 'instructorName',
          type: 'search',
          label: '강사명',
          placeholder: '강사명을 입력하세요',
          width: '24%',
        }

    return [
      {
        key: 'exposureMode',
        type: 'radio',
        label: '노출 기준',
        options: [
          { label: '프로그램별', value: 'program' },
          { label: '강사별', value: 'instructor' },
        ],
        width: '14%',
      },
      nameFilter,
      {
        key: 'pendingPaymentBucket',
        type: 'select',
        label: '지급 대기 정산 항목',
        placeholder: '전체',
        options: PENDING_PAYMENT_ITEM_FILTER_OPTIONS,
        allowClear: true,
        width: '18%',
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '기간',
        width: '44%',
        dateRangeOneMonthFromStart: true,
      },
    ]
  }, [isProgram])

  const renderHeader = (_mode: PageViewMode): ReactElement => {
    return (
      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">
            {isProgram ? '프로그램 별 정산 목록' : '강사 별 정산 목록'}
          </span>
          <span className="table-description">총 {total}건</span>
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
        filterDateRange={appliedFromUrl.dateRange}
        onFilterDateRangeApply={applyDateRangeFromCalendar}
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
        scroll={{ x: PAYMENT_ORDERS_LIST_SCROLL_X_PROGRAM }}
        onRowClick={record => setDetailState({ type: 'program', data: record })}
      />
    ) : (
      <PaymentOrdersTable<PaymentOrderAdminInstructorRow>
        key="payment-orders-instructor"
        rowKey="no"
        columns={instructorColumns}
        dataSource={listInstructor}
        scroll={{ x: PAYMENT_ORDERS_LIST_SCROLL_X_INSTRUCTOR }}
        onRowClick={record => setDetailState({ type: 'instructor', data: record })}
      />
    )

  return (
    <div className="payment-orders-page">
      <div className="payment-orders-page__content-wrapper">
        <FilterTableLayout
          className="payment-orders-page__filter-list-layout"
          bordered={false}
          cardStyle={{ marginBottom: 0 }}
          fields={paymentOrdersFilterFields}
          filters={{
            exposureMode,
            programName: pendingFilters.programName,
            instructorName: pendingFilters.instructorName,
            pendingPaymentBucket:
              pendingFilters.pendingPaymentBucket === 'all'
                ? undefined
                : pendingFilters.pendingPaymentBucket,
            dateRange: pendingFilters.dateRange,
          }}
          onFilterChange={handleFilterChange}
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
      </div>

      <PaymentOrderDetailFullPageModal
        type={detailState?.type ?? 'program'}
        isOpen={detailState !== null}
        onClose={closeDetail}
        data={detailState?.data ?? null}
        listPageDateRange={appliedFromUrl.dateRange}
      />
    </div>
  )
}
