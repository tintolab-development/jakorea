import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type PersonalInfoAccessHistoryPendingFilters = {
  accessPurpose: string
  accessorName: string
  dateRange: PersonalInfoAccessHistoryPendingDateRange
}

type PersonalInfoAccessHistoryPendingDateRange =
  | [Dayjs, Dayjs]
  | [Dayjs | null, Dayjs | null]
  | null

function dayjsPairEqual(
  a: PersonalInfoAccessHistoryPendingDateRange,
  b: PersonalInfoAccessHistoryPendingDateRange
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (a[0]?.valueOf() ?? null) === (b[0]?.valueOf() ?? null) &&
    (a[1]?.valueOf() ?? null) === (b[1]?.valueOf() ?? null)
}

function normalizeDateRangePickerValue(value: unknown): PersonalInfoAccessHistoryPendingDateRange {
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
  prev: PersonalInfoAccessHistoryPendingDateRange
}): PersonalInfoAccessHistoryPendingDateRange {
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

/** 서버 필터를 신뢰하고 조회 일시 내림차순만 맞춥니다. */
function sortLogs(data: PersonalInfoAccessLog[]): PersonalInfoAccessLog[] {
  return [...data].sort(
    (a, b) => dayjs(b.accessedAt).valueOf() - dayjs(a.accessedAt).valueOf()
  )
}

const tanstackColumns: ColumnDef<PersonalInfoAccessLog>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<PersonalInfoAccessHistoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'accessPurpose',
    paramKey: 'pia_purpose',
    condition: f => f.accessPurpose.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'accessorName',
    paramKey: 'pia_accessor',
    condition: f => f.accessorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
        nextParams.set('pia_from', filters.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('pia_to', filters.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('pia_from')
        nextParams.delete('pia_to')
      }
    },
  },
]

export const personalInfoAccessHistoryTablePageConfig: TablePageConfig<
  PersonalInfoAccessLog,
  PersonalInfoAccessHistoryPendingFilters,
  Record<string, never>
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<PersonalInfoAccessLog> => [],
  },
  filters: {
    initialPending: {
      accessPurpose: '',
      accessorName: '',
      dateRange: null,
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const accessPurpose = searchParams.get('pia_purpose') ?? ''
      const accessorName = searchParams.get('pia_accessor') ?? ''
      const from = searchParams.get('pia_from')
      const to = searchParams.get('pia_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          from,
          to,
          prev: prev.dateRange,
        })
        const next: PersonalInfoAccessHistoryPendingFilters = {
          accessPurpose,
          accessorName,
          dateRange,
        }
        if (
          prev.accessPurpose === next.accessPurpose &&
          prev.accessorName === next.accessorName &&
          dayjsPairEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },
    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get('pia_purpose') ?? '').trim()) return true
      if ((searchParams.get('pia_accessor') ?? '').trim()) return true
      if (searchParams.get('pia_from') && searchParams.get('pia_to')) return true
      return false
    },
    getBaseCount: ({ filteredData }) => filteredData.length,
    onFilterChange: ({ prev, key, value }) => {
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValue(value) }
      }
      if (key === 'accessPurpose' || key === 'accessorName') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as PersonalInfoAccessHistoryPendingFilters
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
