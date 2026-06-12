import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type BugIssueHistoryPendingFilters = {
  userName: string
  dateRange: BugIssueHistoryPendingDateRange
}

type BugIssueHistoryPendingDateRange =
  | [Dayjs, Dayjs]
  | [Dayjs | null, Dayjs | null]
  | null

function dayjsPairEqual(
  a: BugIssueHistoryPendingDateRange,
  b: BugIssueHistoryPendingDateRange
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (a[0]?.valueOf() ?? null) === (b[0]?.valueOf() ?? null) &&
    (a[1]?.valueOf() ?? null) === (b[1]?.valueOf() ?? null)
}

function normalizeDateRangePickerValue(value: unknown): BugIssueHistoryPendingDateRange {
  if (!Array.isArray(value) || value.length < 2) return null
  const start = (value[0] ?? null) as Dayjs | null
  const end = (value[1] ?? null) as Dayjs | null
  if (start == null && end == null) return null
  return [start, end]
}

const urlDateRangeSyncState = { hadCompleteInUrl: false }

function resolvePendingDateRangeFromUrl(args: {
  from: string | null
  to: string | null
  prev: BugIssueHistoryPendingDateRange
}): BugIssueHistoryPendingDateRange {
  const { from, to, prev } = args
  if (from && to) {
    urlDateRangeSyncState.hadCompleteInUrl = true
    return [dayjs(from), dayjs(to)]
  }
  if (urlDateRangeSyncState.hadCompleteInUrl) {
    urlDateRangeSyncState.hadCompleteInUrl = false
    return null
  }
  return prev ?? null
}

function filterLogs(data: BugIssueLog[], searchParams: URLSearchParams): BugIssueLog[] {
  const userName = (searchParams.get('bil_user') ?? '').trim().toLowerCase()
  const from = searchParams.get('bil_from')
  const to = searchParams.get('bil_to')

  return data
    .filter(row => {
      if (userName && !row.userName.toLowerCase().includes(userName)) return false
      if (from && to) {
        const occurredAt = dayjs(row.occurredAt)
        const start = dayjs(from).startOf('day')
        const end = dayjs(to).endOf('day')
        if (occurredAt.isBefore(start) || occurredAt.isAfter(end)) return false
      }
      return true
    })
    .sort((a, b) => dayjs(b.occurredAt).valueOf() - dayjs(a.occurredAt).valueOf())
}

const tanstackColumns: ColumnDef<BugIssueLog>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<BugIssueHistoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'userName',
    paramKey: 'bil_user',
    condition: f => f.userName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
        nextParams.set('bil_from', filters.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('bil_to', filters.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('bil_from')
        nextParams.delete('bil_to')
      }
    },
  },
]

export const bugIssueHistoryTablePageConfig: TablePageConfig<
  BugIssueLog,
  BugIssueHistoryPendingFilters,
  Record<string, never>
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<BugIssueLog> => [],
  },
  filters: {
    initialPending: {
      userName: '',
      dateRange: null,
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const userName = searchParams.get('bil_user') ?? ''
      const from = searchParams.get('bil_from')
      const to = searchParams.get('bil_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          from,
          to,
          prev: prev.dateRange,
        })
        const next: BugIssueHistoryPendingFilters = {
          userName,
          dateRange,
        }
        if (prev.userName === next.userName && dayjsPairEqual(prev.dateRange, next.dateRange)) {
          return prev
        }
        return next
      })
    },
    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get('bil_user') ?? '').trim()) return true
      if (searchParams.get('bil_from') && searchParams.get('bil_to')) return true
      return false
    },
    getBaseCount: ({ filteredData }) => filteredData.length,
    onFilterChange: ({ prev, key, value }) => {
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValue(value) }
      }
      if (key === 'userName') {
        return { ...prev, userName: String(value ?? '') }
      }
      return { ...prev, [key]: value } as BugIssueHistoryPendingFilters
    },
  },
  filterFn: ({ data, searchParams }) => {
    const filtered = filterLogs(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },
  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
