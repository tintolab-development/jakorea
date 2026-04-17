import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'

const P = 'po'

export type ExposureMode = 'program' | 'instructor'

/** 지급 대기 정산 항목 구간 — `all`은 URL·필터에서 미선택 */
export type PendingPaymentItemBucket = 'all' | 'none' | '1-5' | '6-10' | '11plus'

export type PaymentOrdersPendingFilters = {
  programName: string
  instructorName: string
  pendingPaymentBucket: PendingPaymentItemBucket
  dateRange: [Dayjs, Dayjs] | null
}

export type PaymentOrdersTableContext = {
  setExposureMode: (m: ExposureMode) => void
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

function matchesPendingBucket(count: number, bucket: PendingPaymentItemBucket): boolean {
  if (bucket === 'all') return true
  if (bucket === 'none') return count === 0
  if (bucket === '1-5') return count >= 1 && count <= 5
  if (bucket === '6-10') return count >= 6 && count <= 10
  if (bucket === '11plus') return count >= 11
  return true
}

export function parsePaymentOrdersFiltersFromUrl(
  searchParams: URLSearchParams
): Pick<
  PaymentOrdersPendingFilters,
  'programName' | 'instructorName' | 'pendingPaymentBucket' | 'dateRange'
> {
  const programName = searchParams.get(`${P}_prog`) ?? ''
  const instructorName = searchParams.get(`${P}_inst`) ?? ''
  const pb = searchParams.get(`${P}_pb`) ?? ''
  const pendingPaymentBucket: PendingPaymentItemBucket =
    pb === 'none' || pb === '1-5' || pb === '6-10' || pb === '11plus' ? pb : 'all'
  const fromStr = searchParams.get(`${P}_from`)
  const toStr = searchParams.get(`${P}_to`)
  let dateRange: [Dayjs, Dayjs] | null = null
  if (fromStr && toStr) {
    const a = dayjs(fromStr)
    const b = dayjs(toStr)
    if (a.isValid() && b.isValid()) dateRange = [a, b]
  }
  return { programName, instructorName, pendingPaymentBucket, dateRange }
}

export function filterPaymentProgramRows(
  rows: PaymentOrderAdminProgramRow[],
  applied: Pick<
    PaymentOrdersPendingFilters,
    'programName' | 'pendingPaymentBucket' | 'dateRange'
  >
): PaymentOrderAdminProgramRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.programName.includes(q)) return false
    if (!matchesPendingBucket(row.pendingPaymentSettlementItemCount, applied.pendingPaymentBucket)) {
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
    'instructorName' | 'pendingPaymentBucket' | 'dateRange'
  >
): PaymentOrderAdminInstructorRow[] {
  const q = applied.instructorName.trim()
  return rows.filter(row => {
    if (q && !row.instructorName.includes(q)) return false
    if (!matchesPendingBucket(row.pendingPaymentSettlementItemCount, applied.pendingPaymentBucket)) {
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

function searchSyncRules(): readonly TableSearchParamRule<PaymentOrdersPendingFilters>[] {
  return [
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
      filterKey: 'pendingPaymentBucket',
      paramKey: `${P}_pb`,
      condition: f => f.pendingPaymentBucket !== 'all',
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
): TablePageConfig<Row, PaymentOrdersPendingFilters, PaymentOrdersTableContext> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<Row> => [],
    },
    filters: {
      initialPending: {
        programName: '',
        instructorName: '',
        pendingPaymentBucket: 'all',
        dateRange: null,
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        setPendingFilters(prev => {
          const { programName, instructorName, pendingPaymentBucket, dateRange } =
            parsePaymentOrdersFiltersFromUrl(searchParams)
          const next: PaymentOrdersPendingFilters = {
            programName,
            instructorName,
            pendingPaymentBucket,
            dateRange,
          }
          if (
            prev.programName === next.programName &&
            prev.instructorName === next.instructorName &&
            prev.pendingPaymentBucket === next.pendingPaymentBucket &&
            (prev.dateRange === null && next.dateRange === null ||
              (prev.dateRange?.[0]?.valueOf() === next.dateRange?.[0]?.valueOf() &&
                prev.dateRange?.[1]?.valueOf() === next.dateRange?.[1]?.valueOf()))
          ) {
            return prev
          }
          return next
        })
      },
      hasActiveFilters: ({ searchParams }) =>
        Boolean(
          (searchParams.get(`${P}_prog`) ?? '').trim() ||
            (searchParams.get(`${P}_inst`) ?? '').trim() ||
            (searchParams.get(`${P}_pb`) && searchParams.get(`${P}_pb`) !== 'all') ||
            (searchParams.get(`${P}_from`) && searchParams.get(`${P}_to`))
        ),
      getBaseCount: ({ filteredData }) => filteredData.length,
      onFilterChange: ({ prev, key, value, context }) => {
        if (key === 'exposureMode') {
          context.setExposureMode(value as ExposureMode)
          return prev
        }
        if (key === 'programName') {
          return { ...prev, programName: (value as string) ?? '' }
        }
        if (key === 'instructorName') {
          return { ...prev, instructorName: (value as string) ?? '' }
        }
        if (key === 'pendingPaymentBucket') {
          return {
            ...prev,
            pendingPaymentBucket: (value ?? 'all') as PendingPaymentItemBucket,
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
