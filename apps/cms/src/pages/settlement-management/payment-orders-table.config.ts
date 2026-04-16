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

export type AppliedStatus = 'all' | PaymentOrderAdminProcessingStatus

export type PaymentOrdersPendingFilters = {
  programName: string
  status: AppliedStatus
  dateRange: [Dayjs, Dayjs] | null
}

export type PaymentOrdersTableContext = {
  setExposureMode: (m: ExposureMode) => void
}

function matchesDateRange(referenceDate: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range[1]) return true
  const d = dayjs(referenceDate)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

export function parsePaymentOrdersFiltersFromUrl(
  searchParams: URLSearchParams
): Pick<PaymentOrdersPendingFilters, 'programName' | 'status' | 'dateRange'> {
  const programName = searchParams.get(`${P}_prog`) ?? ''
  const statRaw = searchParams.get(`${P}_stat`)
  const status: AppliedStatus =
    statRaw && statRaw !== 'all' ? (statRaw as PaymentOrderAdminProcessingStatus) : 'all'
  const fromStr = searchParams.get(`${P}_from`)
  const toStr = searchParams.get(`${P}_to`)
  let dateRange: [Dayjs, Dayjs] | null = null
  if (fromStr && toStr) {
    const a = dayjs(fromStr)
    const b = dayjs(toStr)
    if (a.isValid() && b.isValid()) dateRange = [a, b]
  }
  return { programName, status, dateRange }
}

export function filterPaymentProgramRows(
  rows: PaymentOrderAdminProgramRow[],
  applied: Pick<PaymentOrdersPendingFilters, 'programName' | 'status' | 'dateRange'>
): PaymentOrderAdminProgramRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.programName.includes(q)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.referenceDate, applied.dateRange)) return false
    return true
  })
}

export function filterPaymentInstructorRows(
  rows: PaymentOrderAdminInstructorRow[],
  applied: Pick<PaymentOrdersPendingFilters, 'programName' | 'status' | 'dateRange'>
): PaymentOrderAdminInstructorRow[] {
  const q = applied.programName.trim()
  return rows.filter(row => {
    if (q && !row.relatedProgramNames.some(name => name.includes(q))) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.referenceDate, applied.dateRange)) return false
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
      filterKey: 'status',
      paramKey: `${P}_stat`,
      condition: f => f.status !== 'all',
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
        status: 'all',
        dateRange: null,
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters, table: _t, columnFilters: _c, context: _ctx }) => {
        setPendingFilters(prev => {
          const { programName, status, dateRange } = parsePaymentOrdersFiltersFromUrl(searchParams)
          const next: PaymentOrdersPendingFilters = { programName, status, dateRange }
          if (
            prev.programName === next.programName &&
            prev.status === next.status &&
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
            (searchParams.get(`${P}_stat`) && searchParams.get(`${P}_stat`) !== 'all') ||
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
        if (key === 'status') {
          return { ...prev, status: (value ?? 'all') as AppliedStatus }
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
