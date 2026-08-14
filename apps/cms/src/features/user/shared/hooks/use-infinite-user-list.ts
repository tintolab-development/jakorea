/**
 * 전체 회원 목록 무한 스크롤 (React Query useInfiniteQuery)
 * 15명씩 로드
 */

import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useLayoutEffect, useMemo } from 'react'
import { getUsersPage, type GetUsersPageParams, type GetUsersPageResult } from '@/entities/user/api/user-service'
import {
  memberQueryKeys,
  serializeMemberListFilters,
} from '@/features/user/api/member-query-keys'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { User } from '@/types/user'

export type UseInfiniteUserListFilters = GetUsersPageParams

/** 목록 재진입 시 캐시된 2페이지 이상을 refetch하지 않도록 첫 페이지만 남긴다. */
export function keepFirstInfiniteQueryPage<T>(
  data: InfiniteData<T> | undefined
): InfiniteData<T> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

export function useInfiniteUserList(filters: UseInfiniteUserListFilters) {
  const queryClient = useQueryClient()
  const remote = isMembersRemoteEnabled()
  const filtersKey = serializeMemberListFilters(filters)
  const listNamespace = remote ? (filters.role === 'SCHOOL' ? 'schools' : 'members') : 'mock'
  const queryKey = remote
    ? listNamespace === 'schools'
      ? memberQueryKeys.schoolsList(filtersKey)
      : memberQueryKeys.list(filtersKey)
    : (['users', 'list', filters] as const)

  // useInfiniteQuery보다 먼저 두어, refetchOnMount가 캐시된 2페이지를 모두 치지 않게 한다.
  useLayoutEffect(() => {
    const key =
      listNamespace === 'schools'
        ? memberQueryKeys.schoolsList(filtersKey)
        : listNamespace === 'members'
          ? memberQueryKeys.list(filtersKey)
          : (['users', 'list', filters] as const)
    queryClient.setQueryData<InfiniteData<GetUsersPageResult>>(key, keepFirstInfiniteQueryPage)
    // filters 참조는 매 렌더 달라질 수 있어 직렬화된 식별자만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey 안정성은 filtersKey + listNamespace
  }, [queryClient, filtersKey, listNamespace])

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return getUsersPage(filters, pageParam as number)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      if (lastPage.nextPageParam !== undefined) return lastPage.nextPageParam
      return allPages.length
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const users = useMemo(() => {
    if (!query.data?.pages) return []
    return query.data.pages.flatMap(page => page.users) as Omit<User, 'password'>[]
  }, [query.data?.pages])

  const total = query.data?.pages[0]?.total ?? 0

  return {
    users,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}
