/**
 * 정산 관리 > 지급조서 확인 목록 — URL·필터·테이블 데이터·상세 모달 상태
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { flushSync } from 'react-dom'
import type { Dayjs } from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { FilterFieldConfig } from '@/shared/components/table-filter-group'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import type { ViewModeToggleOption } from '@/shared/components/view-mode'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  PaymentOrdersCalendarView,
  PaymentOrdersTable,
} from '@/features/settlement/ui/payment-record'
import {
  createPaymentOrdersTablePageConfig,
  filterPaymentInstructorRows,
  filterPaymentProgramRows,
  parsePaymentOrdersFiltersFromUrl,
  type ExposureMode,
  type PendingPaymentItemBucket,
  type PaymentOrdersTableContext,
} from './payment-orders-table.config'

export type PaymentOrdersPageViewMode = 'list' | 'calendar'

const paymentOrdersViewModeOptions = [
  { value: 'list' as const, label: '리스트 뷰로 보기', icon: <UnorderedListOutlined /> },
  { value: 'calendar' as const, label: '캘린더 뷰로 보기', icon: <CalendarOutlined /> },
] satisfies readonly ViewModeToggleOption<PaymentOrdersPageViewMode>[]

export type PaymentOrdersDetailState =
  | { type: 'program'; data: PaymentOrderAdminProgramRow }
  | { type: 'instructor'; data: PaymentOrderAdminInstructorRow }
  | null

const PAYMENT_ORDERS_LIST_SCROLL_X_PROGRAM = 64 + 360 + 180 + 200 + 168
const PAYMENT_ORDERS_LIST_SCROLL_X_INSTRUCTOR = 64 + 340 + 180 + 200 + 180

const PENDING_PAYMENT_ITEM_FILTER_OPTIONS: {
  value: Exclude<PendingPaymentItemBucket, 'all'>
  label: string
}[] = [
  { value: 'none', label: '없음' },
  { value: '1-5', label: '1 ~ 5개' },
  { value: '6-10', label: '6 ~ 10개' },
  { value: '11plus', label: '11개 이상' },
]

/** 풀페이지 상세 — `replace: false`로 열어 뒤로가기 시 목록 복귀 */
const PO_DETAIL_TYPE = 'po_detail'
const PO_DETAIL_NO = 'po_detail_no'

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function usePaymentOrdersListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<PaymentOrdersPageViewMode>('list')
  const [exposureMode, setExposureMode] = useState<ExposureMode>('program')

  const paymentOrdersDefaultRangeAppliedRef = useRef(false)

  const tablePageConfig = useMemo(() => createPaymentOrdersTablePageConfig(), [])

  useEffect(() => {
    const from = searchParams.get('po_from')
    const to = searchParams.get('po_to')
    if (from && to && from.startsWith('2025-') && to.startsWith('2025-')) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('po_from', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.from)
          next.set('po_to', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.to)
          return next
        },
        { replace: true }
      )
      return
    }
    if (paymentOrdersDefaultRangeAppliedRef.current) return
    if (from && to) {
      paymentOrdersDefaultRangeAppliedRef.current = true
      return
    }
    if (!from && !to) {
      paymentOrdersDefaultRangeAppliedRef.current = true
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('po_from', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.from)
          next.set('po_to', PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE.to)
          return next
        },
        { replace: true }
      )
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

  const detailState = useMemo((): PaymentOrdersDetailState => {
    const t = searchParams.get(PO_DETAIL_TYPE)
    const noRaw = searchParams.get(PO_DETAIL_NO)
    if (t !== 'program' && t !== 'instructor') return null
    if (noRaw == null || noRaw === '') return null
    const no = Number(noRaw)
    if (!Number.isFinite(no)) return null
    if (t === 'program') {
      const data = mockPaymentOrderAdminProgramList.find(r => r.no === no)
      return data != null ? { type: 'program' as const, data } : null
    }
    const data = mockPaymentOrderAdminInstructorList.find(r => r.no === no)
    return data != null ? { type: 'instructor' as const, data } : null
  }, [searchParams])

  const detailExposureFromUrl = useMemo((): ExposureMode | null => {
    const t = searchParams.get(PO_DETAIL_TYPE)
    return t === 'program' || t === 'instructor' ? t : null
  }, [searchParams])

  const resolvedExposureMode: ExposureMode = detailExposureFromUrl ?? exposureMode

  const isProgram = resolvedExposureMode === 'program'
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
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete(PO_DETAIL_TYPE)
      next.delete(PO_DETAIL_NO)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const openPaymentOrderDetail = useCallback(
    (
      type: 'program' | 'instructor',
      data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow
    ) => {
      setExposureMode(type)
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set(PO_DETAIL_TYPE, type)
        next.set(PO_DETAIL_NO, String(data.no))
        return next
      }, { replace: false })
    },
    [setSearchParams]
  )

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

  const paymentOrdersFilterFields = useMemo((): FilterFieldConfig[] => {
    const nameFilter: FilterFieldConfig = isProgram
      ? {
          key: 'programName',
          type: 'search',
          label: '프로그램명',
          placeholder: '프로그램명을 입력하세요',
          width: '25%',
        }
      : {
          key: 'instructorName',
          type: 'search',
          label: '강사명',
          placeholder: '강사명을 입력하세요',
          width: '25%',
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
        width: '16%',
      },
      nameFilter,
      {
        key: 'pendingPaymentBucket',
        type: 'select',
        label: '지급 대기 정산 항목',
        placeholder: '전체',
        options: PENDING_PAYMENT_ITEM_FILTER_OPTIONS,
        allowClear: true,
        width: '25%',
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '기간',
        width: '34%',
        dateRangeOneMonthFromStart: true,
      },
    ]
  }, [isProgram])

  const renderHeader = useCallback(
    (_mode: PaymentOrdersPageViewMode): ReactElement => {
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
    },
    [isProgram, total]
  )

  const renderContent = useCallback(
    (mode: PaymentOrdersPageViewMode): ReactElement =>
      mode === 'calendar' ? (
        <PaymentOrdersCalendarView
          key={`${appliedResetKey}-${resolvedExposureMode}`}
          exposure={resolvedExposureMode}
          programRows={listProgram}
          instructorRows={listInstructor}
          filterDateRange={appliedFromUrl.dateRange}
          onFilterDateRangeApply={applyDateRangeFromCalendar}
          onPaymentStatusDetailClick={payload => {
            if (payload.exposure === 'program') {
              openPaymentOrderDetail('program', payload.row)
            } else {
              openPaymentOrderDetail('instructor', payload.row)
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
          onRowClick={record => openPaymentOrderDetail('program', record)}
        />
      ) : (
        <PaymentOrdersTable<PaymentOrderAdminInstructorRow>
          key="payment-orders-instructor"
          rowKey="no"
          columns={instructorColumns}
          dataSource={listInstructor}
          scroll={{ x: PAYMENT_ORDERS_LIST_SCROLL_X_INSTRUCTOR }}
          onRowClick={record => openPaymentOrderDetail('instructor', record)}
        />
      ),
    [
      appliedResetKey,
      resolvedExposureMode,
      listProgram,
      listInstructor,
      appliedFromUrl.dateRange,
      applyDateRangeFromCalendar,
      isProgram,
      programColumns,
      instructorColumns,
      openPaymentOrderDetail,
    ]
  )

  const excelExport = useMemo(
    () => ({
      columns: isProgram ? programColumns : instructorColumns,
      data: isProgram ? listProgram : listInstructor,
    }),
    [isProgram, programColumns, instructorColumns, listProgram, listInstructor]
  )

  const listTitle = isProgram ? '프로그램 별 정산 목록' : '강사 별 정산 목록'

  return {
    viewMode,
    setViewMode,
    exposureMode,
    detailState,
    closeDetail,
    appliedFromUrl,
    pendingFilters,
    handleSearch,
    handleFilterChange,
    paymentOrdersFilterFields,
    paymentOrdersViewModeOptions,
    renderHeader,
    renderContent,
    excelExport,
    listTitle,
    total,
  }
}
