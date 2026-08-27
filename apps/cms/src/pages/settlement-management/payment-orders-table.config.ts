import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProcessingStatus,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'

const P = 'po'

export const PAYMENT_ORDERS_EXPOSURE_PARAM_KEY = `${P}_exp`

/** 지급 현황 상세 풀페이지 — 목록 필터 쿼리와 분리 */
export const PAYMENT_ORDERS_DETAIL_TYPE_PARAM = `${P}_detail`
export const PAYMENT_ORDERS_DETAIL_NO_PARAM = `${P}_detail_no`
export const PAYMENT_ORDERS_DETAIL_KEY_PARAM = `${P}_detail_key`

const PAYMENT_ORDERS_DETAIL_QUERY_KEYS = [
  PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
  PAYMENT_ORDERS_DETAIL_NO_PARAM,
  PAYMENT_ORDERS_DETAIL_KEY_PARAM,
] as const

/** 목록·캘린더 쿼리 키에서 상세 모달 파라미터를 제외한다. */
export function paymentOrdersListQuerySearchParamsKey(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams)
  for (const key of PAYMENT_ORDERS_DETAIL_QUERY_KEYS) {
    next.delete(key)
  }
  return next.toString()
}

/** aggregates 캐시 키 — 노출 기준은 query key의 groupBy로 분리한다. */
export function paymentOrdersListFilterQueryKey(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(paymentOrdersListQuerySearchParamsKey(searchParams))
  next.delete(PAYMENT_ORDERS_EXPOSURE_PARAM_KEY)
  return next.toString()
}

export type ExposureMode = 'program' | 'instructor'

/** 지급조서 처리 현황 — `all`은 URL·필터에서 미선택 */
export type PaymentOrderProcessingStatusFilter = 'all' | PaymentOrderAdminProcessingStatus

export type PaymentOrdersPendingFilters = {
  exposureMode: ExposureMode
  programName: string
  instructorName: string
  processingStatus: PaymentOrderProcessingStatusFilter
  dateRange: [Dayjs, Dayjs] | null
}

function hasSettlementAttendanceInRange(
  referenceDate: string,
  settlementDates: string[],
  range: [Dayjs, Dayjs] | null
): boolean {
  if (!range?.[0] || !range[1]) return true
  const dates = settlementDates.length > 0 ? settlementDates : [referenceDate]
  return dates.some(iso => {
    const d = dayjs(iso)
    return d.isValid() && !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
  })
}

const PROCESSING_STATUS_PARAM_VALUES: PaymentOrderAdminProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'application_rejected',
]

export function parsePaymentOrdersExposureMode(raw: string | null): ExposureMode {
  return raw === 'instructor' ? 'instructor' : 'program'
}

export function parsePaymentOrdersFiltersFromUrl(
  searchParams: URLSearchParams
): PaymentOrdersPendingFilters {
  const exposureMode = parsePaymentOrdersExposureMode(
    searchParams.get(PAYMENT_ORDERS_EXPOSURE_PARAM_KEY)
  )
  const programName = searchParams.get(`${P}_prog`) ?? ''
  const instructorName = searchParams.get(`${P}_inst`) ?? ''
  const statusRaw = searchParams.get(`${P}_status`) ?? ''
  const processingStatus: PaymentOrderProcessingStatusFilter =
    PROCESSING_STATUS_PARAM_VALUES.includes(statusRaw as PaymentOrderAdminProcessingStatus)
      ? (statusRaw as PaymentOrderAdminProcessingStatus)
      : 'all'
  const fromStr = searchParams.get(`${P}_from`)
  const toStr = searchParams.get(`${P}_to`)
  let dateRange: [Dayjs, Dayjs] | null = null
  if (fromStr && toStr) {
    const a = dayjs(fromStr)
    const b = dayjs(toStr)
    if (a.isValid() && b.isValid()) dateRange = [a, b]
  }
  return { exposureMode, programName, instructorName, processingStatus, dateRange }
}

export function filterPaymentProgramRows(
  rows: PaymentOrderAdminProgramRow[],
  applied: Pick<
    PaymentOrdersPendingFilters,
    'programName' | 'processingStatus' | 'dateRange'
  >
): PaymentOrderAdminProgramRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.programName.includes(q)) return false
    if (applied.processingStatus !== 'all' && row.processingStatus !== applied.processingStatus) {
      return false
    }
    if (
      !hasSettlementAttendanceInRange(
        row.referenceDate,
        row.settlementRelevantAttendanceDates,
        applied.dateRange
      )
    ) {
      return false
    }
    return true
  })
}

export function filterPaymentInstructorRows(
  rows: PaymentOrderAdminInstructorRow[],
  applied: Pick<
    PaymentOrdersPendingFilters,
    'instructorName' | 'processingStatus' | 'dateRange'
  >
): PaymentOrderAdminInstructorRow[] {
  const q = applied.instructorName.trim()
  return rows.filter(row => {
    if (q && !row.instructorName.includes(q)) return false
    if (applied.processingStatus !== 'all' && row.processingStatus !== applied.processingStatus) {
      return false
    }
    if (
      !hasSettlementAttendanceInRange(
        row.referenceDate,
        row.settlementRelevantAttendanceDates,
        applied.dateRange
      )
    ) {
      return false
    }
    return true
  })
}

type Row = PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow

const tanstackColumns: ColumnDef<Row>[] = [{ accessorKey: 'no', header: 'no' }]

function isSamePendingDateRange(
  a: PaymentOrdersPendingFilters['dateRange'],
  b: PaymentOrdersPendingFilters['dateRange']
): boolean {
  return (
    (a === null && b === null) ||
    (a?.[0]?.valueOf() === b?.[0]?.valueOf() && a?.[1]?.valueOf() === b?.[1]?.valueOf())
  )
}

function searchSyncRules(): readonly TableSearchParamRule<PaymentOrdersPendingFilters>[] {
  return [
    {
      kind: 'param',
      filterKey: 'exposureMode',
      paramKey: PAYMENT_ORDERS_EXPOSURE_PARAM_KEY,
      transform: v => (v === 'instructor' ? 'instructor' : 'program'),
    },
    {
      kind: 'param',
      filterKey: 'programName',
      paramKey: `${P}_prog`,
      condition: f => f.programName.trim().length > 0,
      transform: v => String(v).trim(),
    },
    {
      kind: 'param',
      filterKey: 'instructorName',
      paramKey: `${P}_inst`,
      condition: f => f.instructorName.trim().length > 0,
      transform: v => String(v).trim(),
    },
    {
      kind: 'param',
      filterKey: 'processingStatus',
      paramKey: `${P}_status`,
      condition: f => f.processingStatus !== 'all',
      transform: v => String(v),
    },
    {
      kind: 'apply',
      apply: (nextParams, filters) => {
        nextParams.delete(`${P}_from`)
        nextParams.delete(`${P}_to`)
        const range = filters.dateRange
        if (range?.[0] && range[1]) {
          nextParams.set(`${P}_from`, range[0].format('YYYY-MM-DD'))
          nextParams.set(`${P}_to`, range[1].format('YYYY-MM-DD'))
        }
      },
    },
  ]
}

export function createPaymentOrdersTablePageConfig(
  opts?: { onAfterApplySearch?: () => void }
): TablePageConfig<Row, PaymentOrdersPendingFilters, Record<string, never>> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<Row> => [],
    },
    filters: {
      initialPending: {
        exposureMode: 'program',
        programName: '',
        instructorName: '',
        processingStatus: 'all',
        dateRange: null,
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        setPendingFilters(prev => {
          const next = parsePaymentOrdersFiltersFromUrl(searchParams)
          if (
            prev.exposureMode === next.exposureMode &&
            prev.programName === next.programName &&
            prev.instructorName === next.instructorName &&
            prev.processingStatus === next.processingStatus &&
            isSamePendingDateRange(prev.dateRange, next.dateRange)
          ) {
            return prev
          }
          return next
        })
      },
      hasActiveFilters: ({ searchParams }) =>
        Boolean(
          searchParams.get(PAYMENT_ORDERS_EXPOSURE_PARAM_KEY) === 'instructor' ||
            (searchParams.get(`${P}_prog`) ?? '').trim() ||
            (searchParams.get(`${P}_inst`) ?? '').trim() ||
            (searchParams.get(`${P}_status`) && searchParams.get(`${P}_status`) !== 'all') ||
            (searchParams.get(`${P}_from`) && searchParams.get(`${P}_to`))
        ),
      getBaseCount: ({ filteredData }) => filteredData.length,
      onFilterChange: ({ prev, key, value }) => {
        if (key === 'exposureMode') {
          return {
            ...prev,
            exposureMode: value === 'instructor' ? 'instructor' : 'program',
          }
        }
        if (key === 'programName') {
          return { ...prev, programName: (value as string) ?? '' }
        }
        if (key === 'instructorName') {
          return { ...prev, instructorName: (value as string) ?? '' }
        }
        if (key === 'processingStatus') {
          return {
            ...prev,
            processingStatus: (value == null || value === ''
              ? 'all'
              : value) as PaymentOrderProcessingStatusFilter,
          }
        }
        if (key === 'dateRange') {
          return { ...prev, dateRange: value as [Dayjs, Dayjs] | null }
        }
        return { ...prev, [key]: value }
      },
    },
    filterFn: ({ data }) => ({ dataForTable: data, filteredData: data }),
    getSearchSync: () => ({
      paramConfig: searchSyncRules(),
      tableConfig: {},
      afterApplyParams: () => {
        opts?.onAfterApplySearch?.()
      },
    }),
  }
}
