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
  dateRange: [Dayjs, Dayjs] | null
}

function dayjsPairEqual(a: [Dayjs, Dayjs] | null, b: [Dayjs, Dayjs] | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a[0].valueOf() === b[0].valueOf() && a[1].valueOf() === b[1].valueOf()
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
      const dateRange = from && to ? ([dayjs(from), dayjs(to)] as [Dayjs, Dayjs]) : null

      setPendingFilters(prev => {
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
        const range = Array.isArray(value) ? value : null
        if (range?.[0] && range[1]) {
          return { ...prev, dateRange: [range[0], range[1]] }
        }
        return { ...prev, dateRange: null }
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
