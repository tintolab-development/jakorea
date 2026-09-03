import { useCallback } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTextbookDetail } from '@/features/textbook/api/admin-textbooks-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'

/** Class D detail — 재오픈 시 스피너 없이 캐시 우선 */
const TEXTBOOK_DETAIL_STALE_TIME_MS = 60_000
const TEXTBOOK_DETAIL_GC_TIME_MS = 10 * 60_000

export function textbookDetailQueryOptions(textbookId: string) {
  return queryOptions({
    queryKey: dataManagementQueryKeys.textbooks.detail(textbookId),
    queryFn: () => getTextbookDetail(textbookId),
    staleTime: TEXTBOOK_DETAIL_STALE_TIME_MS,
    gcTime: TEXTBOOK_DETAIL_GC_TIME_MS,
    retry: false,
  })
}

export function useTextbookDetailQuery(id: string | null, enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', enabled && Boolean(id))

  return useQuery({
    ...textbookDetailQueryOptions(id ?? ''),
    enabled: remoteEnabled && Boolean(id),
  })
}

export function usePrefetchTextbookDetail() {
  const queryClient = useQueryClient()
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks')

  return useCallback(
    (textbookId: string) => {
      if (!remoteEnabled || !textbookId) return
      // 이미 fresh 캐시가 있으면 네트워크 생략 (클릭 오픈 전 워밍용)
      const existing = queryClient.getQueryData(dataManagementQueryKeys.textbooks.detail(textbookId))
      if (existing) return
      void queryClient.prefetchQuery(textbookDetailQueryOptions(textbookId))
    },
    [queryClient, remoteEnabled]
  )
}
