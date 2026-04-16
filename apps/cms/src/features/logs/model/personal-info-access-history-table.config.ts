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
  dateRange: [Dayjs, Dayjs] | null
}

function dayjsPairEqual(a: [Dayjs, Dayjs] | null, b: [Dayjs, Dayjs] | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a[0].valueOf() === b[0].valueOf() && a[1].valueOf() === b[1].valueOf()
}

function filterLogs(data: PersonalInfoAccessLog[], searchParams: URLSearchParams): PersonalInfoAccessLog[] {
  const accessPurpose = (searchParams.get('pia_purpose') ?? '').trim().toLowerCase()
  const accessorName = (searchParams.get('pia_accessor') ?? '').trim().toLowerCase()
  const from = searchParams.get('pia_from')
  const to = searchParams.get('pia_to')

  return data
    .filter(row => {
      if (accessPurpose && !row.accessPurpose.toLowerCase().includes(accessPurpose)) return false
      if (accessorName && !row.accessorName.toLowerCase().includes(accessorName)) return false
      if (from && to) {
        const accessedAt = dayjs(row.accessedAt)
        const start = dayjs(from).startOf('day')
        const end = dayjs(to).endOf('day')
        if (accessedAt.isBefore(start) || accessedAt.isAfter(end)) return false
      }
      return true
    })
    .sort((a, b) => dayjs(b.accessedAt).valueOf() - dayjs(a.accessedAt).valueOf())
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
      const dateRange = from && to ? ([dayjs(from), dayjs(to)] as [Dayjs, Dayjs]) : null

      setPendingFilters(prev => {
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
        const range = Array.isArray(value) ? value : null
        if (range?.[0] && range?.[1]) {
          return { ...prev, dateRange: [range[0], range[1]] }
        }
        return { ...prev, dateRange: null }
      }
      if (key === 'accessPurpose' || key === 'accessorName') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as PersonalInfoAccessHistoryPendingFilters
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
