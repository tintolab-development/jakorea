/**
 * 전체 회원 목록 무한 스크롤 (React Query useInfiniteQuery)
 * 15명씩 로드
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getUsersPage, type GetUsersPageParams } from '@/entities/user/api/user-service'
import type { User } from '@/types/user'

export type UseInfiniteUserListFilters = GetUsersPageParams

export function useInfiniteUserList(filters: UseInfiniteUserListFilters) {
  const queryKey = ['users', 'list', filters]

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await getUsersPage(filters, pageParam as number)
      return result
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length
    },
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
