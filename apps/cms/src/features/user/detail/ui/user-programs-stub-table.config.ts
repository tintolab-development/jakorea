import type { Application } from '@/types/domain'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'

/** 필터 없는 수강 이력 섹션 — `useTablePage`로 FilterTableLayout API만 맞춘다. */
export type UserProgramsStubContext = Record<string, never>

export type UserProgramsStubFilters = Record<string, unknown>

export const userProgramsEnrollmentStubTableConfig: TablePageConfig<
  Application,
  UserProgramsStubFilters,
  UserProgramsStubContext
> = {
  columns: {
    tanstack: [{ accessorKey: 'id', header: 'id' }],
    filterKeys: [],
    resolveAntdColumns: () => [],
  },
  filters: {
    initialPending: {},
    syncPendingFromUrl: ({ setPendingFilters }) => {
      setPendingFilters(p => p)
    },
    hasActiveFilters: () => false,
    getBaseCount: ({ filteredData }) => filteredData.length,
  },
  filterFn: ({ data }) => ({ dataForTable: data, filteredData: data }),
  getSearchSync: () => ({ paramConfig: [], tableConfig: {} }),
}
