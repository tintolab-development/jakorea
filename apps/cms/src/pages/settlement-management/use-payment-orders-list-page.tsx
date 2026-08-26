/**
 * 정산 관리 > 지급조서 확인 목록 — URL·필터·테이블 데이터·상세 모달 상태
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { flushSync } from 'react-dom'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'
import type { FilterFieldConfig } from '@/shared/components/table-filter-group'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import type { ViewModeToggleOption } from '@/shared/components/view-mode'
import {
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  PAYMENT_ORDER_STATUS_LABELS_LIST,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  getPaymentOrdersDefaultDateRangeParams,
  isSamePaymentOrdersDateRange,
  resolvePaymentOrdersCalendarFilterRange,
} from './payment-orders-date-range'
import {
  calendarRangeFromFilter,
  mapCalendarItemsToPaymentOrderEvents,
} from '@/features/settlement-management/api/calendar/map-calendar-items-to-events'
import { useSettlementCalendarQuery } from '@/features/settlement-management/hooks/use-settlement-calendar-query'
import { usePaymentOrdersListQuery } from '@/features/settlement-management/hooks/use-payment-orders-list-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import {
  PaymentOrdersCalendarView,
  PaymentOrdersTable,
} from '@/features/settlement/ui/payment-record'
import {
  createPaymentOrdersTablePageConfig,
  filterPaymentInstructorRows,
  filterPaymentProgramRows,
  parsePaymentOrdersFiltersFromUrl,
  paymentOrdersListQuerySearchParamsKey,
  PAYMENT_ORDERS_DETAIL_KEY_PARAM,
  PAYMENT_ORDERS_DETAIL_NO_PARAM,
  PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
  PAYMENT_ORDERS_EXPOSURE_PARAM_KEY,
  type ExposureMode,
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

const PROCESSING_STATUS_FILTER_OPTIONS: {
  value: PaymentOrderAdminProcessingStatus
  label: string
}[] = (
  Object.entries(PAYMENT_ORDER_STATUS_LABELS_LIST) as [PaymentOrderAdminProcessingStatus, string][]
).map(([value, label]) => ({ value, label }))

/** 풀페이지 상세 — `replace: false`로 열어 뒤로가기 시 목록 복귀 */
const PO_DETAIL_TYPE = PAYMENT_ORDERS_DETAIL_TYPE_PARAM
const PO_DETAIL_NO = PAYMENT_ORDERS_DETAIL_NO_PARAM
const PO_DETAIL_KEY = PAYMENT_ORDERS_DETAIL_KEY_PARAM

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function pickPaymentOrdersListAnchorDate(
  exposure: ExposureMode,
  programRows: PaymentOrderAdminProgramRow[],
  instructorRows: PaymentOrderAdminInstructorRow[]
): Dayjs {
  const rows = exposure === 'program' ? programRows : instructorRows
  if (rows.length === 0) return dayjs()
  let min: Dayjs | null = null
  for (const row of rows) {
    const dates =
      row.settlementRelevantAttendanceDates.length > 0
        ? row.settlementRelevantAttendanceDates
        : [row.referenceDate]
    for (const iso of dates) {
      const d = dayjs(iso)
      if (!d.isValid()) continue
      if (min == null || d.isBefore(min, 'day')) min = d
    }
  }
  return min ?? dayjs(rows[0].referenceDate)
}

export function usePaymentOrdersListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<PaymentOrdersPageViewMode>('list')

  const paymentOrdersDefaultRangeAppliedRef = useRef(false)

  const tablePageConfig = useMemo(() => createPaymentOrdersTablePageConfig(), [])

  useEffect(() => {
    const from = searchParams.get('po_from')
    const to = searchParams.get('po_to')
    const defaultRange = getPaymentOrdersDefaultDateRangeParams()
    if (from && to && from.startsWith('2025-') && to.startsWith('2025-')) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('po_from', defaultRange.from)
          next.set('po_to', defaultRange.to)
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
          next.set('po_from', defaultRange.from)
          next.set('po_to', defaultRange.to)
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

  const paymentOrdersRemote = shouldUseSettlementRemote('paymentOrders')
  const searchParamsKey = paymentOrdersListQuerySearchParamsKey(searchParams)
  const remoteListQuery = usePaymentOrdersListQuery(searchParamsKey, paymentOrdersRemote)

  const calendarRange = useMemo(
    () => calendarRangeFromFilter(appliedFromUrl.dateRange, dayjs()),
    [appliedFromUrl.dateRange]
  )

  const remoteCalendarQuery = useSettlementCalendarQuery(
    calendarRange.fromDate,
    calendarRange.toDate,
    paymentOrdersRemote && viewMode === 'calendar'
  )

  const sourceProgramRows = useMemo(() => {
    if (paymentOrdersRemote) {
      return remoteListQuery.data?.programRows ?? []
    }
    return mockPaymentOrderAdminProgramList
  }, [paymentOrdersRemote, remoteListQuery.data?.programRows])

  const sourceInstructorRows = useMemo(() => {
    if (paymentOrdersRemote) {
      return remoteListQuery.data?.instructorRows ?? []
    }
    return mockPaymentOrderAdminInstructorList
  }, [paymentOrdersRemote, remoteListQuery.data?.instructorRows])

  const listProgram = useMemo(
    () => filterPaymentProgramRows(sourceProgramRows, appliedFromUrl),
    [sourceProgramRows, appliedFromUrl]
  )
  const listInstructor = useMemo(
    () => filterPaymentInstructorRows(sourceInstructorRows, appliedFromUrl),
    [sourceInstructorRows, appliedFromUrl]
  )

  const detailState = useMemo((): PaymentOrdersDetailState => {
    const t = searchParams.get(PO_DETAIL_TYPE)
    const keyRaw = searchParams.get(PO_DETAIL_KEY)
    const noRaw = searchParams.get(PO_DETAIL_NO)
    if (t !== 'program' && t !== 'instructor') return null

    if (keyRaw) {
      if (t === 'program') {
        const data = sourceProgramRows.find(r => r.aggregateKey === keyRaw)
        return data != null ? { type: 'program' as const, data } : null
      }
      const data = sourceInstructorRows.find(r => r.aggregateKey === keyRaw)
      return data != null ? { type: 'instructor' as const, data } : null
    }

    if (noRaw == null || noRaw === '') return null
    const no = Number(noRaw)
    if (!Number.isFinite(no)) return null
    if (t === 'program') {
      const data = sourceProgramRows.find(r => r.no === no)
      return data != null ? { type: 'program' as const, data } : null
    }
    const data = sourceInstructorRows.find(r => r.no === no)
    return data != null ? { type: 'instructor' as const, data } : null
  }, [searchParams, sourceProgramRows, sourceInstructorRows])

  const detailExposureFromUrl = useMemo((): ExposureMode | null => {
    const t = searchParams.get(PO_DETAIL_TYPE)
    return t === 'program' || t === 'instructor' ? t : null
  }, [searchParams])

  const resolvedExposureMode: ExposureMode =
    detailExposureFromUrl ?? appliedFromUrl.exposureMode

  const calendarEventsOverride = useMemo(() => {
    if (!paymentOrdersRemote || viewMode !== 'calendar') return undefined
    const items = remoteCalendarQuery.data ?? []
    return mapCalendarItemsToPaymentOrderEvents(
      items,
      resolvedExposureMode,
      listProgram,
      listInstructor
    )
  }, [
    paymentOrdersRemote,
    viewMode,
    remoteCalendarQuery.data,
    resolvedExposureMode,
    listProgram,
    listInstructor,
  ])

  const isProgram = resolvedExposureMode === 'program'
  const rowsForTable = useMemo(
    () =>
      (isProgram ? listProgram : listInstructor) as (
        | PaymentOrderAdminProgramRow
        | PaymentOrderAdminInstructorRow
      )[],
    [isProgram, listProgram, listInstructor]
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
    context: EMPTY_TABLE_PAGE_CONTEXT,
  })

  const handleFilterChangeWithExposureUrl = useCallback(
    (key: string, value: unknown) => {
      handleFilterChange(key, value)
      if (key !== 'exposureMode') return
      const mode: ExposureMode = value === 'instructor' ? 'instructor' : 'program'
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(PAYMENT_ORDERS_EXPOSURE_PARAM_KEY, mode)
          return next
        },
        { replace: true }
      )
    },
    [handleFilterChange, setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(PO_DETAIL_TYPE)
        next.delete(PO_DETAIL_NO)
        next.delete(PO_DETAIL_KEY)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const openPaymentOrderDetail = useCallback(
    (
      type: 'program' | 'instructor',
      data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow
    ) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(PO_DETAIL_TYPE, type)
          if (data.aggregateKey) {
            next.set(PO_DETAIL_KEY, data.aggregateKey)
            next.delete(PO_DETAIL_NO)
          } else {
            next.set(PO_DETAIL_NO, String(data.no))
            next.delete(PO_DETAIL_KEY)
          }
          return next
        },
        { replace: false }
      )
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

  const handleViewModeChange = useCallback(
    (next: PaymentOrdersPageViewMode) => {
      if (next === 'calendar') {
        const anchor = pickPaymentOrdersListAnchorDate(
          resolvedExposureMode,
          listProgram,
          listInstructor
        )
        const calendarFilterRange = resolvePaymentOrdersCalendarFilterRange(
          appliedFromUrl.dateRange,
          anchor
        )
        if (!isSamePaymentOrdersDateRange(appliedFromUrl.dateRange, calendarFilterRange)) {
          flushSync(() => {
            setPendingFilters(prev => ({ ...prev, dateRange: calendarFilterRange }))
          })
          handleSearch()
        }
      }
      setViewMode(next)
    },
    [
      appliedFromUrl.dateRange,
      handleSearch,
      listInstructor,
      listProgram,
      resolvedExposureMode,
      setPendingFilters,
    ]
  )

  const appliedResetKey = useMemo(
    () => paymentOrdersListQuerySearchParamsKey(searchParams),
    [searchParams]
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
        title: '정산 대상자',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: 180,
        align: 'center',
        render: (n: number) => `${n}명`,
      },
      {
        title: '지급 대기 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        width: 200,
        align: 'center',
        render: (count: number) => `${count}개`,
      },
      {
        title: '총 정산 신청 금액',
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
        title: '신청자명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        ellipsis: { showTitle: true },
        width: 340,
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상 프로그램',
        dataIndex: 'programCount',
        key: 'programCount',
        width: 180,
        align: 'center',
        render: (n: number) => `${n}개`,
      },
      {
        title: '지급 대기 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        width: 200,
        align: 'center',
        render: (count: number) => `${count}개`,
      },
      {
        title: '총 정산 신청 금액',
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

  const pendingIsProgram = pendingFilters.exposureMode !== 'instructor'

  const paymentOrdersFilterFields = useMemo((): FilterFieldConfig[] => {
    const nameFilter: FilterFieldConfig = pendingIsProgram
      ? {
          key: 'programName',
          type: 'search',
          label: '프로그램명',
          placeholder: '프로그램명을 입력하세요',
          width: FILTER_CONTROL_MAX_WIDTH_PX,
        }
      : {
          key: 'instructorName',
          type: 'search',
          label: '강사명',
          placeholder: '강사명을 입력하세요',
          width: FILTER_CONTROL_MAX_WIDTH_PX,
        }

    return [
      {
        key: 'exposureMode',
        type: 'radio',
        label: '노출 기준',
        options: [
          { label: '프로그램별', value: 'program' },
          { label: '신청자별', value: 'instructor' },
        ],
      },
      nameFilter,
      {
        key: 'processingStatus',
        type: 'select',
        label: '지급조서 처리 현황',
        placeholder: '전체',
        options: PROCESSING_STATUS_FILTER_OPTIONS,
        allowClear: true,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '강의 출강일',
        dateRangeOneMonthFromStart: true,
        width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
      },
    ]
  }, [pendingIsProgram])

  const listTitle = isProgram ? '프로그램별 정산 목록' : '신청자별 정산 목록'

  const paymentOrdersExcelExport = useMemo((): FilterTableExcelExportConfig => {
    if (isProgram) {
      return { columns: programColumns, data: listProgram }
    }
    return { columns: instructorColumns, data: listInstructor }
  }, [isProgram, programColumns, instructorColumns, listProgram, listInstructor])

  const renderContent = useCallback(
    (mode: PaymentOrdersPageViewMode): ReactElement =>
      mode === 'calendar' ? (
        <div className="participating-institutions-section__calendar-wrap">
          <PaymentOrdersCalendarView
            key={`${appliedResetKey}-${resolvedExposureMode}`}
            exposure={resolvedExposureMode}
            programRows={listProgram}
            instructorRows={listInstructor}
            eventsOverride={calendarEventsOverride}
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
        </div>
      ) : (
        <div className="participating-institutions-section__table-wrap list-page-layout__table-shell">
          {isProgram ? (
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
          )}
        </div>
      ),
    [
      appliedResetKey,
      resolvedExposureMode,
      listProgram,
      listInstructor,
      calendarEventsOverride,
      appliedFromUrl.dateRange,
      applyDateRangeFromCalendar,
      isProgram,
      programColumns,
      instructorColumns,
      openPaymentOrderDetail,
    ]
  )

  return {
    viewMode,
    setViewMode: handleViewModeChange,
    detailState,
    closeDetail,
    appliedFromUrl,
    pendingFilters,
    handleSearch,
    handleFilterChange: handleFilterChangeWithExposureUrl,
    paymentOrdersFilterFields,
    paymentOrdersViewModeOptions,
    listTitle,
    total,
    paymentOrdersExcelExport,
    renderContent,
    paymentOrdersRemote,
    remoteListQuery,
    remoteCalendarQuery,
  }
}
