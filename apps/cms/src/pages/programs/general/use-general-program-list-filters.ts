import { useCallback, useLayoutEffect, useMemo } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { GeneralProgramsRemoteListPage } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  generalProgramListInfiniteQueryOptions,
  readGeneralProgramTableFilters,
  serializeGeneralProgramTableFilters,
} from '@/features/program/general/api/general-program-list-query'
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

/** 목록 헤더 `총 N건 | …` 안내 (시안 01. 목록_리스트뷰·캘린더뷰) */
const GENERAL_PROGRAM_LIST_HEADER_NOTICE = '진행 중이거나 완료된 프로그램은 삭제할 수 없습니다.'

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
    () => readGeneralProgramTableFilters(searchParams),
    [searchParams]
  )
  const tableFiltersKey = useMemo(
    () => serializeGeneralProgramTableFilters(tableFilters),
    [tableFilters]
  )
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
    ...generalProgramListInfiniteQueryOptions(statusFilter, tableFilters),
    enabled: remoteEnabled,
    // 상단 위젯 단계 이동 시 새 키 응답 전까지 이전 목록을 유지 (빈 표 → 스피너 → 표 깜빡임 방지)
    placeholderData: keepPreviousData,
  })
  const isPlaceholderData = remoteEnabled && remoteListQuery.isPlaceholderData

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
      calendarProgramType: 'GENERAL',
      serverSideOverviewFilters: remoteEnabled,
      // 일반 프로그램 시안: 예정 탭 기간 요일 표기 · No. 내림차순 · 헤더 삭제 불가 안내
      columnPreset: 'general',
      rowNumberOrder: 'desc',
      headerNotice: GENERAL_PROGRAM_LIST_HEADER_NOTICE,
    }
  }, [remoteEnabled, statusFilter])

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
    isPlaceholderData,
    isFetchingNextPage: remoteEnabled ? remoteListQuery.isFetchingNextPage : false,
    fetchNextPage: remoteListQuery.fetchNextPage,
    hasNextPage:
      remoteEnabled && !isPlaceholderData ? (remoteListQuery.hasNextPage ?? false) : false,
    listQueryFiltersKey: tableFiltersKey,
    isRemoteDataSource: remoteEnabled,
  }
}
