import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  DetailedProgramManagementPendingFilters,
  DetailedProgramManagementRow,
  DetailedProgramManagementTableContext,
  DetailedProgramUsageFilter,
} from './detailed-program-management.types'

function parseUsage(raw: string | null): DetailedProgramUsageFilter {
  if (raw === 'active' || raw === 'inactive') return raw
  return 'ALL'
}

function filterRows(
  data: DetailedProgramManagementRow[],
  searchParams: URLSearchParams
): DetailedProgramManagementRow[] {
  const nameQ = (searchParams.get('dp_name') ?? '').trim().toLowerCase()
  const usage = parseUsage(searchParams.get('dp_use'))

  return data.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (usage === 'active' && !row.active) return false
    if (usage === 'inactive' && row.active) return false
    return true
  })
}

const tanstackColumns: ColumnDef<DetailedProgramManagementRow>[] = [
  { accessorKey: 'id', header: 'id' },
]

const searchSyncRules: readonly TableSearchParamRule<DetailedProgramManagementPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'programName',
    paramKey: 'dp_name',
    condition: f => (f.programName ?? '').trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'usageStatus',
    paramKey: 'dp_use',
    condition: f => f.usageStatus !== 'ALL',
    transform: v => String(v),
  },
]

export const detailedProgramManagementTablePageConfig: TablePageConfig<
  DetailedProgramManagementRow,
  DetailedProgramManagementPendingFilters,
  DetailedProgramManagementTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<DetailedProgramManagementRow> => [],
  },

  filters: {
    initialPending: {
      programName: '',
      usageStatus: 'ALL',
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const programName = searchParams.get('dp_name') ?? ''
      const usageStatus = parseUsage(searchParams.get('dp_use'))

      setPendingFilters(prev => {
        if (prev.programName === programName && prev.usageStatus === usageStatus) {
          return prev
        }
        return { programName, usageStatus }
      })
    },

    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get('dp_name') ?? '').trim()) return true
      if (parseUsage(searchParams.get('dp_use')) !== 'ALL') return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,
  },

  filterFn: ({ data, searchParams }) => {
    const filtered = filterRows(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (_context: DetailedProgramManagementTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
