import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import { parseDetailedProgramUsageFilter as parseUsage } from '@/features/detailed-program/api/detailed-program-filter-params'
import type {
  DetailedProgramManagementPendingFilters,
  DetailedProgramManagementRow,
  DetailedProgramManagementTableContext,
} from './detailed-program-management.types'

const tanstackColumns: ColumnDef<DetailedProgramManagementRow>[] = [
  { accessorKey: 'id', header: 'id' },
]

const searchSyncRules: readonly TableSearchParamRule<DetailedProgramManagementPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'usageStatus',
    paramKey: 'dp_use',
    condition: f => f.usageStatus !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'programName',
    paramKey: 'dp_name',
    condition: f => (f.programName ?? '').trim().length > 0,
    transform: v => String(v).trim(),
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

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'usageStatus') {
        return { ...prev, usageStatus: parseUsage(typeof value === 'string' ? value : null) }
      }
      return { ...prev, [key]: value }
    },

    getBaseCount: ({ filteredData }) => filteredData.length,
  },

  /** 서버 필터만 사용 — 클라 이중 필터 없음 */
  filterFn: ({ data }) => ({ dataForTable: data, filteredData: data }),

  getSearchSync: (_context: DetailedProgramManagementTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
