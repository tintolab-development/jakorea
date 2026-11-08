/**
 * 정산 관리 > 지급조서 확인 목록 — URL·필터·테이블 데이터·상세 모달 상태
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { flushSync } from 'react-dom'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatNumberDisplay } from '@/shared/utils'
import { useSearchParams } from 'react-router-dom'
import { useNavigateToAncestor } from '@/shared/hooks/use-history-ancestor-navigation'
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
  PAYMENT_ORDER_STATUS_LABELS_LIST,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  PAYMENT_ORDER_PENDING_ITEM_BUCKET_LABELS,
  PAYMENT_ORDER_PENDING_ITEM_BUCKETS,
} from './payment-orders-pending-item-bucket'
import {
  getPaymentOrdersDefaultDateRangeParams,
  isPaymentOrdersLegacyPlaceholderDateRange,
  isPaymentOrdersListDateRangeReady,
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


/** 시안: 셀렉트 기본값은 「전체」 옵션(값 `all`) — placeholder가 아니라 선택값으로 노출 */
const ALL_FILTER_OPTION = { value: 'all', label: '전체' } as const

const PROCESSING_STATUS_FILTER_OPTIONS: {
  value: PaymentOrderAdminProcessingStatus | 'all'
  label: string
}[] = [
  ALL_FILTER_OPTION,
  ...(
    Object.entries(PAYMENT_ORDER_STATUS_LABELS_LIST) as [PaymentOrderAdminProcessingStatus, string][]
  ).map(([value, label]) => ({ value, label })),
]

const PENDING_ITEM_BUCKET_FILTER_OPTIONS = [
  ALL_FILTER_OPTION,
  ...PAYMENT_ORDER_PENDING_ITEM_BUCKETS.map(value => ({
    value,
    label: PAYMENT_ORDER_PENDING_ITEM_BUCKET_LABELS[value],
  })),
]

/** 풀페이지 상세 — `replace: false`로 열어 뒤로가기 시 목록 복귀 */
const PO_DETAIL_TYPE = PAYMENT_ORDERS_DETAIL_TYPE_PARAM
const PO_DETAIL_NO = PAYMENT_ORDERS_DETAIL_NO_PARAM
const PO_DETAIL_KEY = PAYMENT_ORDERS_DETAIL_KEY_PARAM

function formatWon(amount: number): string {
  return `${formatNumberDisplay(amount)}원`
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
    if (isPaymentOrdersLegacyPlaceholderDateRange(from, to)) {
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
  const listDateRangeReady = isPaymentOrdersListDateRangeReady(
    searchParams.get('po_from'),
    searchParams.get('po_to')
  )
  const remoteListQuery = usePaymentOrdersListQuery(
    searchParamsKey,
    paymentOrdersRemote && listDateRangeReady,
    viewMode
  )

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
    return []
  }, [paymentOrdersRemote, remoteListQuery.data?.programRows])

  const sourceInstructorRows = useMemo(() => {
    if (paymentOrdersRemote) {
      return remoteListQuery.data?.instructorRows ?? []
    }
    return []
  }, [paymentOrdersRemote, remoteListQuery.data?.instructorRows])

  const listProgram = useMemo(
    () => filterPaymentProgramRows(sourceProgramRows, appliedFromUrl, viewMode),
    [sourceProgramRows, appliedFromUrl, viewMode]
  )
  const listInstructor = useMemo(
    () => filterPaymentInstructorRows(sourceInstructorRows, appliedFromUrl, viewMode),
    [sourceInstructorRows, appliedFromUrl, viewMode]
  )

  const detailState = useMemo((): PaymentOrdersDetailState => {
    const t = searchParams.get(PO_DETAIL_TYPE)
    const keyRaw = searchParams.get(PO_DETAIL_KEY)
    const noRaw = searchParams.get(PO_DETAIL_NO)
    if (t !== 'program' && t !== 'instructor') return null

    if (keyRaw) {
      if (t === 'program') {
        const data = sourceProgramRows.find(r => r.aggregateKey === keyRaw)
        if (data != null) return { type: 'program' as const, data }
        const programId = Number(keyRaw)
        if (!Number.isFinite(programId)) return null
        /** 목록에 아직 없거나 필터 밖이어도 deep-link로 상세 API를 칠 수 있게 stub */
        return {
          type: 'program' as const,
          data: {
            no: 0,
            programId,
            aggregateKey: keyRaw,
            programName: `프로그램 ${programId}`,
            instructorCount: 0,
            processingStatus: 'pending',
            estimatedAmount: 0,
            referenceDate: searchParams.get('po_from') ?? dayjs().format('YYYY-MM-DD'),
            settlementRelevantAttendanceDates: [],
            pendingPaymentSettlementItemCount: 0,
          },
        }
      }
      const data = sourceInstructorRows.find(r => r.aggregateKey === keyRaw)
      if (data != null) return { type: 'instructor' as const, data }
      const instructorMemberId = Number(keyRaw)
      if (!Number.isFinite(instructorMemberId)) return null
      return {
        type: 'instructor' as const,
        data: {
          no: 0,
          instructorMemberId,
          aggregateKey: keyRaw,
          instructorName: `신청자 ${instructorMemberId}`,
          programCount: 0,
          processingStatus: 'pending',
          estimatedAmount: 0,
          relatedProgramNames: [],
          referenceDate: searchParams.get('po_from') ?? dayjs().format('YYYY-MM-DD'),
          settlementRelevantAttendanceDates: [],
          pendingPaymentSettlementItemCount: 0,
        },
      }
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

  const resolvedExposureMode: ExposureMode = detailExposureFromUrl ?? appliedFromUrl.exposureMode

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

  const { toSearch: navigateToAncestorSearch } = useNavigateToAncestor()

  /** 상세 닫기 — 목록 엔트리가 history에 있으면 뒤로, 없으면 replace */
  const closeDetail = useCallback(() => {
    navigateToAncestorSearch(prev => {
      const next = new URLSearchParams(prev)
      next.delete(PO_DETAIL_TYPE)
      next.delete(PO_DETAIL_NO)
      next.delete(PO_DETAIL_KEY)
      return next
    })
  }, [navigateToAncestorSearch])

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
        width: 80,
        align: 'center',
        // 시안: 번호는 총 건수부터 역순(13 → 1). 행 식별자 `no`(상세 URL 키)는 그대로 둔다.
        render: (_: number, __: PaymentOrderAdminProgramRow, index: number) =>
          listProgram.length - index,
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: { showTitle: true },
        // 유연 열 — 남는 폭 흡수 (시안: No. 80 · 나머지 240)
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상자',
        dataIndex: 'instructorCount',
        key: 'instructorCount',
        width: 240,
        align: 'center',
        render: (n: number) => `${n}명`,
      },
      {
        title: '지급 대기 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        width: 240,
        align: 'center',
        render: (count: number) => `${count}개`,
      },
      {
        title: '총 정산 신청 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 240,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
    ],
    [listProgram.length]
  )
  const instructorColumns: ColumnsType<PaymentOrderAdminInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
        render: (_: number, __: PaymentOrderAdminInstructorRow, index: number) =>
          listInstructor.length - index,
      },
      {
        title: '신청자명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        ellipsis: { showTitle: true },
        // 시안(12432:441236): No. 80 외 4열 균등(364.5) — 모두 유연 열로 남는 폭을 나눈다
        minWidth: 240,
        align: 'center',
      },
      {
        title: '정산 대상 프로그램',
        dataIndex: 'programCount',
        key: 'programCount',
        minWidth: 240,
        align: 'center',
        render: (n: number) => `${n}개`,
      },
      {
        title: '지급 대기 항목',
        dataIndex: 'pendingPaymentSettlementItemCount',
        key: 'pendingPaymentSettlementItemCount',
        minWidth: 240,
        align: 'center',
        render: (count: number) => `${count}개`,
      },
      {
        title: '총 정산 신청 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        minWidth: 240,
        align: 'center',
        render: (amount: number) => formatWon(amount),
      },
    ],
    [listInstructor.length]
  )

  const total = isProgram ? listProgram.length : listInstructor.length

  const pendingIsProgram = pendingFilters.exposureMode !== 'instructor'

  const paymentOrdersFilterFields = useMemo((): FilterFieldConfig[] => {
    const nameFilter: FilterFieldConfig = pendingIsProgram
      ? {
          key: 'programName',
          type: 'search',
          label: '프로그램명',
          placeholder: '프로그램명을 입력해 주세요',
          width: FILTER_CONTROL_MAX_WIDTH_PX,
        }
      : {
          key: 'instructorName',
          type: 'search',
          label: '신청자명',
          placeholder: '신청자명을 입력해 주세요',
          width: FILTER_CONTROL_MAX_WIDTH_PX,
        }

    const statusOrBucketFilter: FilterFieldConfig =
      viewMode === 'calendar'
        ? {
            key: 'processingStatus',
            type: 'select',
            label: '지급조서 처리 현황',
            placeholder: '전체',
            options: PROCESSING_STATUS_FILTER_OPTIONS,
            width: FILTER_CONTROL_MAX_WIDTH_PX,
          }
        : {
            key: 'pendingItemBucket',
            type: 'select',
            label: '지급 대기 항목',
            placeholder: '전체',
            options: PENDING_ITEM_BUCKET_FILTER_OPTIONS,
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
      statusOrBucketFilter,
      {
        key: 'dateRange',
        type: 'dateRange',
        label: '강의 출강일',
        dateRangeOneMonthFromStart: true,
        width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
      },
    ]
  }, [pendingIsProgram, viewMode])

  const listTitle = isProgram ? '프로그램별 정산 목록' : '신청자별 정산 목록'

  const paymentOrdersExcelExport = useMemo((): FilterTableExcelExportConfig => {
    if (isProgram) {
      return {
        columns: programColumns,
        data: listProgram,
        accessLog: { downloadKind: 'PAYMENT_ORDER_LIST_EXPORT', containedPiiTypes: [] },
      }
    }
    return {
      columns: instructorColumns,
      data: listInstructor,
      // 신청자별 목록은 신청자명 컬럼이 있다
      accessLog: { downloadKind: 'PAYMENT_ORDER_LIST_EXPORT', containedPiiTypes: ['NAME'] },
    }
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
              onRowClick={record => openPaymentOrderDetail('program', record)}
            />
          ) : (
            <PaymentOrdersTable<PaymentOrderAdminInstructorRow>
              key="payment-orders-instructor"
              rowKey="no"
              columns={instructorColumns}
              dataSource={listInstructor}
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
    listDateRangeReady,
  }
}
