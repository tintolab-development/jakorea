import { useCallback, useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  fetchGeneralProgramsRemoteListPage,
  type GeneralProgramsRemoteListPage,
} from '@/features/program/general/api/admin-general-programs-service'
import type { GeneralProgramListTableFilters } from '@/features/program/general/api/general-program-list-filter-params'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import {
  GENERAL_PROGRAM_OVERVIEW_STATUS_VALUES,
  type GeneralProgramOverviewStatusFilter,
} from '@/features/program/general/lib/list-status-filter'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { ProgramListConfig } from '@/features/program/general/ui/program-list'
import { useQueryParams } from '@/shared/hooks/use-query-params'

export type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'

export interface GeneralProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  status?: GeneralProgramOverviewStatusFilter | 'economy_scheduled' | 'economy_in_progress' | 'economy_completed'
}

const LIST_STALE_TIME_MS = 30_000

function readTableFiltersFromSearchParams(
  searchParams: URLSearchParams
): GeneralProgramListTableFilters {
  return {
    title: searchParams.get('title') ?? undefined,
    lifecycleStatus: searchParams.get('lifecycleStatus') ?? undefined,
    targetLevel: searchParams.get('targetLevel') ?? undefined,
    participantRecruitment: searchParams.get('participantRecruitment') ?? undefined,
    operationStartDate: searchParams.get('operationStartDate') ?? undefined,
    operationEndDate: searchParams.get('operationEndDate') ?? undefined,
  }
}

function serializeTableFilters(filters: GeneralProgramListTableFilters): string {
  return JSON.stringify(filters)
}

/** 목록 재진입 시 캐시된 2페이지 이상을 refetch하지 않도록 첫 페이지만 남긴다. */
function keepFirstInfiniteQueryPage<T>(
  data: InfiniteData<T> | undefined
): InfiniteData<T> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

export function useGeneralProgramListFilters() {
  const { params, setParam } = useQueryParams<GeneralProgramListQueryParams>()
  const [searchParams] = useSearchParams()
  const remoteEnabled = useGeneralProgramsRemoteEnabled()
  const queryClient = useQueryClient()

  const statusFilter = useMemo<GeneralProgramOverviewStatusFilter | null>(() => {
    const value = params.status
    if (value && (GENERAL_PROGRAM_OVERVIEW_STATUS_VALUES as readonly string[]).includes(value)) {
      return value as GeneralProgramOverviewStatusFilter
    }
    if (value === 'economy_scheduled') return 'scheduled'
    if (value === 'economy_in_progress') return 'in_progress'
    if (value === 'economy_completed') return 'completed'
    return null
  }, [params.status])

  const tableFilters = useMemo(
    () => readTableFiltersFromSearchParams(searchParams),
    [searchParams]
  )
  const tableFiltersKey = useMemo(() => serializeTableFilters(tableFilters), [tableFilters])
  const listQueryKey = useMemo(
    () => generalProgramQueryKeys.list(statusFilter, tableFiltersKey),
    [statusFilter, tableFiltersKey]
  )

  useLayoutEffect(() => {
    if (!remoteEnabled) return
    queryClient.setQueryData<InfiniteData<GeneralProgramsRemoteListPage>>(
      listQueryKey,
      keepFirstInfiniteQueryPage
    )
    // listQueryKey 배열 참조는 렌더마다 바뀌면 안 되므로 status/filters 식별자만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusFilter + tableFiltersKey + remoteEnabled
  }, [queryClient, statusFilter, tableFiltersKey, remoteEnabled])

  const remoteListQuery = useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam }) =>
      fetchGeneralProgramsRemoteListPage(statusFilter, tableFilters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: LIST_STALE_TIME_MS,
    retry: false,
  })

  const remotePrograms = useMemo(() => {
    if (!remoteEnabled) return []
    return remoteListQuery.data?.pages.flatMap(page => page.programs) ?? []
  }, [remoteEnabled, remoteListQuery.data])

  const filteredPrograms = remotePrograms

  const totalElements = useMemo(() => {
    if (!remoteEnabled) return 0
    return remoteListQuery.data?.pages[0]?.totalElements ?? remotePrograms.length
  }, [remoteEnabled, remoteListQuery.data, remotePrograms.length])

  const refetchPrograms = useCallback(() => {
    if (!remoteEnabled) return
    void remoteListQuery.refetch()
  }, [remoteEnabled, remoteListQuery])

  const headerTitle = useMemo(() => {
    if (statusFilter === 'scheduled') return '진행 예정 프로그램'
    if (statusFilter === 'in_progress') return '진행 중인 프로그램'
    if (statusFilter === 'completed') return '진행 완료된 프로그램'
    return '전체 프로그램'
  }, [statusFilter])

  const programListConfig = useMemo((): ProgramListConfig => {
    const listView: ProgramListView =
      statusFilter === 'scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: 'overview',
      view: listView,
      lifecycleStatus: undefined,
    }
  }, [statusFilter])

  return {
    statusFilter,
    filteredPrograms,
    totalElements,
    headerTitle,
    programListConfig,
    params,
    setParam,
    refetchPrograms,
    loading: remoteEnabled
      ? remoteListQuery.isFetching && !remoteListQuery.isFetchingNextPage
      : false,
    isFetchingNextPage: remoteEnabled ? remoteListQuery.isFetchingNextPage : false,
    fetchNextPage: remoteListQuery.fetchNextPage,
    hasNextPage: remoteEnabled ? (remoteListQuery.hasNextPage ?? false) : false,
    listQueryFiltersKey: tableFiltersKey,
    isRemoteDataSource: remoteEnabled,
  }
}
