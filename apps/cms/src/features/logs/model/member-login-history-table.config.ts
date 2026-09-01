import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { MemberLoginLog } from '@/types/member-login-log'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type MemberLoginHistoryPendingFilters = {
  adminName: string
  loginId: string
  dateRange: MemberLoginHistoryPendingDateRange
}

type MemberLoginHistoryPendingDateRange =
  | [Dayjs, Dayjs]
  | [Dayjs | null, Dayjs | null]
  | null

function dayjsPairEqual(
  a: MemberLoginHistoryPendingDateRange,
  b: MemberLoginHistoryPendingDateRange
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (a[0]?.valueOf() ?? null) === (b[0]?.valueOf() ?? null) &&
    (a[1]?.valueOf() ?? null) === (b[1]?.valueOf() ?? null)
}

function normalizeDateRangePickerValue(value: unknown): MemberLoginHistoryPendingDateRange {
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
  prev: MemberLoginHistoryPendingDateRange
}): MemberLoginHistoryPendingDateRange {
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

/** 서버·mock 필터를 신뢰하고 로그인 일시 내림차순만 맞춥니다. */
function sortLogs(data: MemberLoginLog[]): MemberLoginLog[] {
  return [...data].sort(
    (a, b) => dayjs(b.loggedAt).valueOf() - dayjs(a.loggedAt).valueOf()
  )
}

const tanstackColumns: ColumnDef<MemberLoginLog>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<MemberLoginHistoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'adminName',
    paramKey: 'mlh_name',
    condition: f => f.adminName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'loginId',
    paramKey: 'mlh_id',
    condition: f => f.loginId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
        nextParams.set('mlh_from', filters.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('mlh_to', filters.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('mlh_from')
        nextParams.delete('mlh_to')
      }
    },
  },
]

export const memberLoginHistoryTablePageConfig: TablePageConfig<
  MemberLoginLog,
  MemberLoginHistoryPendingFilters,
  Record<string, never>
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<MemberLoginLog> => [],
  },
  filters: {
    initialPending: {
      adminName: '',
      loginId: '',
      dateRange: null,
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const adminName = searchParams.get('mlh_name') ?? ''
      const loginId = searchParams.get('mlh_id') ?? ''
      const from = searchParams.get('mlh_from')
      const to = searchParams.get('mlh_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          from,
          to,
          prev: prev.dateRange,
        })
        const next: MemberLoginHistoryPendingFilters = {
          adminName,
          loginId,
          dateRange,
        }
        if (
          prev.adminName === next.adminName &&
          prev.loginId === next.loginId &&
          dayjsPairEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },
    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get('mlh_name') ?? '').trim()) return true
      if ((searchParams.get('mlh_id') ?? '').trim()) return true
      if (searchParams.get('mlh_from') && searchParams.get('mlh_to')) return true
      return false
    },
    getBaseCount: ({ filteredData }) => filteredData.length,
    onFilterChange: ({ prev, key, value }) => {
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValue(value) }
      }
      if (key === 'adminName' || key === 'loginId') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as MemberLoginHistoryPendingFilters
    },
  },
  filterFn: ({ data }) => {
    const sorted = sortLogs(data)
    return { dataForTable: sorted, filteredData: sorted }
  },
  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
