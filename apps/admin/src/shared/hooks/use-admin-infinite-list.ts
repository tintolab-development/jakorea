import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useLayoutEffect, useMemo } from 'react'
import {
  flattenAdminListPages,
  keepFirstInfiniteQueryPage,
  nextAdminListPageParam,
  type AdminListPage,
} from '@/shared/lib/admin-infinite-list'

const LIST_STALE_REMOTE_MS = 30_000

export function useAdminInfiniteList<TItem>(options: {
  queryKey: readonly unknown[]
  enabled?: boolean
  isRemote: boolean
  fetchPage: (page: number) => Promise<AdminListPage<TItem>>
  staleTime?: number
  gcTime?: number
  retry?: number | boolean | ((failureCount: number, error: Error) => boolean)
}) {
  const {
    queryKey,
    enabled = true,
    isRemote,
    fetchPage,
    staleTime,
    gcTime,
    retry,
  } = options
  const queryClient = useQueryClient()
  const queryKeySignature = JSON.stringify(queryKey)

  useLayoutEffect(() => {
    if (!isRemote) return
    queryClient.setQueryData<InfiniteData<AdminListPage<TItem>>>(
      queryKey,
      keepFirstInfiniteQueryPage,
    )
    // queryKey 배열은 매 렌더 새로 만들어질 수 있어 직렬화 식별자만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemote, queryClient, queryKeySignature])

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    enabled,
    getNextPageParam: lastPage => nextAdminListPageParam(lastPage),
    staleTime:
      staleTime ?? (isRemote ? LIST_STALE_REMOTE_MS : Number.POSITIVE_INFINITY),
    gcTime,
    retry: retry ?? (isRemote ? 1 : false),
  })

  const rows = useMemo(() => flattenAdminListPages(query.data), [query.data])
  const totalCount = query.data?.pages[0]?.totalCount ?? rows.length

  return {
    rows,
    totalCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
