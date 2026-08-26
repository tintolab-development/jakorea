import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useLayoutEffect, useMemo } from 'react'
import type { LogListPage } from '@/features/logs/api/log-list-page'

const LOGS_LIST_GC_TIME_MS = 10 * 60_000

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

export function useInfiniteLogList<T>(options: {
  queryKey: readonly unknown[]
  queryKeyIdentity: string
  queryFn: (page: number) => Promise<LogListPage<T>>
  enabled?: boolean
}) {
  const queryClient = useQueryClient()
  const { queryKey, queryKeyIdentity, queryFn, enabled = true } = options

  useLayoutEffect(() => {
    queryClient.setQueryData<InfiniteData<LogListPage<T>>>(
      queryKey,
      keepFirstInfiniteQueryPage
    )
    // queryKey 배열 참조는 렌더마다 바뀌므로 직렬화 식별자만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKeyIdentity
  }, [queryClient, queryKeyIdentity])

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNext) return undefined
      const currentPage =
        typeof lastPage.page === 'number' && Number.isFinite(lastPage.page)
          ? lastPage.page
          : allPages.length - 1
      return currentPage + 1
    },
    enabled,
    staleTime: 30_000,
    gcTime: LOGS_LIST_GC_TIME_MS,
    retry: false,
  })

  const rows = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data?.pages]
  )
  const totalElements = query.data?.pages[0]?.totalElements ?? 0

  return {
    rows,
    totalElements,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
