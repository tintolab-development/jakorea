import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type {
  TablePageConfig,
  TablePageFiltersSyncArgs,
} from '@/shared/components/table-system/types/table-page-config'

export type ApplicantListRow = ApplicantSchoolRow | ApplicantInstructorRow

export type ApplicantFilterPending = Record<string, unknown>

export type ApplicantFilterTableContext = Record<string, never>

const tanstackColumns: ColumnDef<ApplicantListRow>[] = [
  { accessorKey: 'id', header: 'id' },
]

export function createApplicantsFilterTablePageConfig(opts: {
  onAfterApplySearch: (filters: ApplicantFilterPending) => void
}): TablePageConfig<ApplicantListRow, ApplicantFilterPending, ApplicantFilterTableContext> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<ApplicantListRow> => [],
    },
    filters: {
      initialPending: {},
      syncPendingFromUrl: (_args: TablePageFiltersSyncArgs<ApplicantListRow, ApplicantFilterPending, ApplicantFilterTableContext>) => {
        /* 목록 필터는 URL에 없음 — 신청자 id 등만 searchParams에 있음 */
      },
      hasActiveFilters: () => false,
      getBaseCount: ({ filteredData }) => filteredData.length,
    },
    filterFn: ({ data }) => ({
      dataForTable: data,
      filteredData: data,
    }),
    getSearchSync: () => ({
      paramConfig: [],
      tableConfig: {},
      afterApplyParams: (_nextParams, filters) => {
        opts.onAfterApplySearch(filters)
      },
    }),
  }
}
