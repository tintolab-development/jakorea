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

export type ExposureMode = 'program' | 'instructor'

/** 지급조서 처리 현황 — `all`은 URL·필터에서 미선택 */
export type PaymentOrderProcessingStatusFilter = 'all' | PaymentOrderAdminProcessingStatus

export type PaymentOrdersPendingFilters = {
  programName: string
  instructorName: string
  processingStatus: PaymentOrderProcessingStatusFilter
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

const PROCESSING_STATUS_PARAM_VALUES: PaymentOrderAdminProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'application_rejected',
]

export function parsePaymentOrdersFiltersFromUrl(
  searchParams: URLSearchParams
): Pick<
  PaymentOrdersPendingFilters,
  'programName' | 'instructorName' | 'processingStatus' | 'dateRange'
> {
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
  return { programName, instructorName, processingStatus, dateRange }
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
        processingStatus: 'all',
        dateRange: null,
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        setPendingFilters(prev => {
          const { programName, instructorName, processingStatus, dateRange } =
            parsePaymentOrdersFiltersFromUrl(searchParams)
          const next: PaymentOrdersPendingFilters = {
            programName,
            instructorName,
            processingStatus,
            dateRange,
          }
          if (
            prev.programName === next.programName &&
            prev.instructorName === next.instructorName &&
            prev.processingStatus === next.processingStatus &&
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
            (searchParams.get(`${P}_status`) && searchParams.get(`${P}_status`) !== 'all') ||
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
