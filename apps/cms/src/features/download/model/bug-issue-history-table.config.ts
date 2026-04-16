import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type BugIssueHistoryPendingFilters = {
  userName: string
  dateRange: [Dayjs, Dayjs] | null
}

function dayjsPairEqual(a: [Dayjs, Dayjs] | null, b: [Dayjs, Dayjs] | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a[0].valueOf() === b[0].valueOf() && a[1].valueOf() === b[1].valueOf()
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
      const dateRange = from && to ? ([dayjs(from), dayjs(to)] as [Dayjs, Dayjs]) : null

      setPendingFilters(prev => {
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
        const range = Array.isArray(value) ? value : null
        if (range?.[0] && range[1]) {
          return { ...prev, dateRange: [range[0], range[1]] }
        }
        return { ...prev, dateRange: null }
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
