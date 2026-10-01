import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query'
import { useLayoutEffect, useMemo } from 'react'
import { DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS } from '@/features/notifications/api/delivery-list-refresh'
import type { SendHistoryListPage } from '@/features/notifications/api/delivery-list-page'

const SEND_HISTORY_LIST_GC_TIME_MS = 10 * 60_000

/** Class E — soft nav 캐시 hit 금지 · 발송 직후 dispatch 지연 흡수 */
const LIST_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: SEND_HISTORY_LIST_GC_TIME_MS,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  retry: false as const,
}

/** 재진입 시 캐시된 2페이지 이상을 모두 refetch하지 않도록 첫 페이지만 남긴다. */
function keepFirstSendHistoryPage<T>(
  data: InfiniteData<SendHistoryListPage<T>> | undefined
): InfiniteData<SendHistoryListPage<T>> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

export function useInfiniteSendHistoryQuery<T>(options: {
  queryKey: QueryKey
  queryKeyIdentity: string
  queryFn: (page: number) => Promise<SendHistoryListPage<T>>
  enabled?: boolean
  shortPoll: boolean
}) {
  const queryClient = useQueryClient()
  const { queryKey, queryKeyIdentity, queryFn, enabled = true, shortPoll } = options

  useLayoutEffect(() => {
    queryClient.setQueryData<InfiniteData<SendHistoryListPage<T>>>(
      queryKey,
      keepFirstSendHistoryPage
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
    ...LIST_QUERY_OPTIONS,
    refetchInterval: shortPoll ? DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS : false,
  })

  const rows = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data?.pages]
  )
  const totalCount = query.data?.pages[0]?.totalCount ?? null

  return {
    rows,
    totalCount,
    searchParamsKey: queryKeyIdentity,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
