import { infiniteQueryOptions } from '@tanstack/react-query'
import {
  fetchGeneralProgramsRemoteListPage,
  type GeneralProgramsRemoteListPage,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import type { GeneralProgramListTableFilters } from '@/features/program/general/api/general-program-list-filter-params'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'

const GENERAL_PROGRAM_LIST_STALE_TIME_MS = 30_000

/** URL 검색 파라미터 → 목록 테이블 필터 (목록 훅·상단 위젯 프리페치가 같은 쿼리 키를 쓰도록 공용) */
export function readGeneralProgramTableFilters(
  searchParams: URLSearchParams
): GeneralProgramListTableFilters {
  return {
    title: searchParams.get('title') ?? undefined,
    lifecycleStatus: searchParams.get('lifecycleStatus') ?? undefined,
    participantType: searchParams.get('participantType') ?? undefined,
    targetLevel: searchParams.get('targetLevel') ?? undefined,
    participantRecruitment: searchParams.get('participantRecruitment') ?? undefined,
    operationStartDate: searchParams.get('operationStartDate') ?? undefined,
    operationEndDate: searchParams.get('operationEndDate') ?? undefined,
  }
}

export function serializeGeneralProgramTableFilters(
  filters: GeneralProgramListTableFilters
): string {
  return JSON.stringify(filters)
}

export function generalProgramListInfiniteQueryOptions(
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters
) {
  return infiniteQueryOptions({
    queryKey: generalProgramQueryKeys.list(
      statusFilter,
      serializeGeneralProgramTableFilters(tableFilters)
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralProgramsRemoteListPage(statusFilter, tableFilters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: GeneralProgramsRemoteListPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: GENERAL_PROGRAM_LIST_STALE_TIME_MS,
    retry: false,
  })
}
