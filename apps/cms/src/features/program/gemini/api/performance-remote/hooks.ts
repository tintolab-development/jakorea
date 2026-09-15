import { useLayoutEffect, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { shouldUseGeminiPerformanceRemoteApi } from './capabilities'
import { geminiPerformanceQueryKeys } from './query-keys'
import {
  listGeminiPerformanceRowsPage,
  type GeminiPerformanceRemoteListPage,
} from './service'

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

export function useGeminiPerformanceListQuery(enabled = true) {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const queryClient = useQueryClient()
  const listQueryKey = useMemo(() => geminiPerformanceQueryKeys.list(), [])

  useLayoutEffect(() => {
    if (!enabled || !remoteEnabled) return
    queryClient.setQueryData<InfiniteData<GeminiPerformanceRemoteListPage>>(
      listQueryKey,
      keepFirstInfiniteQueryPage
    )
  }, [queryClient, enabled, remoteEnabled, listQueryKey])

  return useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam }) => listGeminiPerformanceRowsPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}
