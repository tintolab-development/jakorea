/**
 * 전체 회원 목록 무한 스크롤 (React Query useInfiniteQuery)
 * 15명씩 로드
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getUsersPage, type GetUsersPageParams } from '@/entities/user/api/user-service'
import {
  memberQueryKeys,
  serializeMemberListFilters,
} from '@/features/user/api/member-query-keys'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { User } from '@/types/user'

export type UseInfiniteUserListFilters = GetUsersPageParams

export function useInfiniteUserList(filters: UseInfiniteUserListFilters) {
  const remote = isMembersRemoteEnabled()
  const filtersKey = serializeMemberListFilters(filters)
  const queryKey = remote
    ? filters.role === 'SCHOOL'
      ? memberQueryKeys.schoolsList(filtersKey)
      : memberQueryKeys.list(filtersKey)
    : (['users', 'list', filters] as const)

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
