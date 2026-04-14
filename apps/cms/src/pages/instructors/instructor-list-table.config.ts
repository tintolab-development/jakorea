import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Instructor } from '@/types/domain'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type InstructorListRow = Instructor

export type InstructorListPendingFilters = {
  search: string
  region: string
}

export type InstructorListTableContext = Record<string, never>

const tanstackColumns: ColumnDef<InstructorListRow>[] = [{ accessorKey: 'id', header: 'id' }]

const paramConfig: readonly TableSearchParamRule<InstructorListPendingFilters>[] = [
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      const s = filters.search.trim()
      if (s) nextParams.set('search', s)
      else nextParams.delete('search')
      if (filters.region && filters.region !== 'all') nextParams.set('region', filters.region)
      else nextParams.delete('region')
    },
  },
]

export function createInstructorListTablePageConfig(): TablePageConfig<
  InstructorListRow,
  InstructorListPendingFilters,
  InstructorListTableContext
> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<InstructorListRow> => [],
    },
    filters: {
      initialPending: { search: '', region: 'all' },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        setPendingFilters({
          search: searchParams.get('search') || '',
          region: searchParams.get('region') || 'all',
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
