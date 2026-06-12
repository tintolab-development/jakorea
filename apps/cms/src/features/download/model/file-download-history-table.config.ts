import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { DownloadLog } from '@/types/download-log'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type FileDownloadHistoryPendingFilters = {
  fileName: string
  userName: string
  dateRange: FileDownloadHistoryPendingDateRange
}

type FileDownloadHistoryPendingDateRange =
  | [Dayjs, Dayjs]
  | [Dayjs | null, Dayjs | null]
  | null

function dayjsPairEqual(
  a: FileDownloadHistoryPendingDateRange,
  b: FileDownloadHistoryPendingDateRange
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (a[0]?.valueOf() ?? null) === (b[0]?.valueOf() ?? null) &&
    (a[1]?.valueOf() ?? null) === (b[1]?.valueOf() ?? null)
}

function normalizeDateRangePickerValue(value: unknown): FileDownloadHistoryPendingDateRange {
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
  prev: FileDownloadHistoryPendingDateRange
}): FileDownloadHistoryPendingDateRange {
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

function filterLogs(data: DownloadLog[], searchParams: URLSearchParams): DownloadLog[] {
  const fileName = (searchParams.get('fdl_file') ?? '').trim().toLowerCase()
  const userName = (searchParams.get('fdl_user') ?? '').trim().toLowerCase()
  const from = searchParams.get('fdl_from')
  const to = searchParams.get('fdl_to')

  return data
    .filter(row => {
      if (fileName && !row.fileName.toLowerCase().includes(fileName)) return false
      if (userName && !row.userName.toLowerCase().includes(userName)) return false
      if (from && to) {
        const downloadedAt = dayjs(row.downloadedAt)
        const start = dayjs(from).startOf('day')
        const end = dayjs(to).endOf('day')
        if (downloadedAt.isBefore(start) || downloadedAt.isAfter(end)) return false
      }
      return true
    })
    .sort((a, b) => dayjs(b.downloadedAt).valueOf() - dayjs(a.downloadedAt).valueOf())
}

const tanstackColumns: ColumnDef<DownloadLog>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<FileDownloadHistoryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'fileName',
    paramKey: 'fdl_file',
    condition: f => f.fileName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'userName',
    paramKey: 'fdl_user',
    condition: f => f.userName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
        nextParams.set('fdl_from', filters.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('fdl_to', filters.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('fdl_from')
        nextParams.delete('fdl_to')
      }
    },
  },
]

export const fileDownloadHistoryTablePageConfig: TablePageConfig<
  DownloadLog,
  FileDownloadHistoryPendingFilters,
  Record<string, never>
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<DownloadLog> => [],
  },
  filters: {
    initialPending: {
      fileName: '',
      userName: '',
      dateRange: null,
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const fileName = searchParams.get('fdl_file') ?? ''
      const userName = searchParams.get('fdl_user') ?? ''
      const from = searchParams.get('fdl_from')
      const to = searchParams.get('fdl_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          from,
          to,
          prev: prev.dateRange,
        })
        const next: FileDownloadHistoryPendingFilters = {
          fileName,
          userName,
          dateRange,
        }
        if (
          prev.fileName === next.fileName &&
          prev.userName === next.userName &&
          dayjsPairEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },
    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get('fdl_file') ?? '').trim()) return true
      if ((searchParams.get('fdl_user') ?? '').trim()) return true
      if (searchParams.get('fdl_from') && searchParams.get('fdl_to')) return true
      return false
    },
    getBaseCount: ({ filteredData }) => filteredData.length,
    onFilterChange: ({ prev, key, value }) => {
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValue(value) }
      }
      if (key === 'fileName' || key === 'userName') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as FileDownloadHistoryPendingFilters
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
