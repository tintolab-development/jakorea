import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types/user'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type SchoolListRow = Omit<User, 'password'>

export type SchoolListPendingFilters = {
  search: string
  region: string
}

export type SchoolListTableContext = Record<string, never>

const tanstackColumns: ColumnDef<SchoolListRow>[] = [{ accessorKey: 'id', header: 'id' }]

const paramConfig: readonly TableSearchParamRule<SchoolListPendingFilters>[] = [
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      const s = filters.search.trim()
      if (s) nextParams.set('search', s)
      else nextParams.delete('search')
      if (filters.region && filters.region !== 'ALL') nextParams.set('region', filters.region)
      else nextParams.delete('region')
    },
  },
]

export function createSchoolListTablePageConfig(): TablePageConfig<
  SchoolListRow,
  SchoolListPendingFilters,
  SchoolListTableContext
> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<SchoolListRow> => [],
    },
    filters: {
      initialPending: { search: '', region: 'ALL' },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        setPendingFilters({
          search: searchParams.get('search') || '',
          region: searchParams.get('region') || 'ALL',
        })
      },
      hasActiveFilters: () => false,
      getBaseCount: ({ filteredData }) => filteredData.length,
    },
    filterFn: ({ data }) => ({
      dataForTable: data,
      filteredData: data,
    }),
    getSearchSync: () => ({
      paramConfig,
      tableConfig: {},
    }),
  }
}
