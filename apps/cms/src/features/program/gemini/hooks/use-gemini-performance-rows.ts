import { shouldUseGeminiPerformanceRemoteApi } from '../api/performance-remote/capabilities'
import { useGeminiPerformanceListQuery } from '../api/performance-remote/hooks'
import type { GeminiPerformanceRow } from '../model/performance/types'

/** API only — gate OFF면 빈 목록. size=20 infinite */
export function useGeminiPerformanceRows(): GeminiPerformanceRow[] {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const remoteQuery = useGeminiPerformanceListQuery(remoteEnabled)
  if (!remoteEnabled) return []
  return remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
}

export function useGeminiPerformanceRowsQueryState() {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const remoteQuery = useGeminiPerformanceListQuery(remoteEnabled)
  return {
    remoteEnabled,
    isFetching: remoteEnabled
      ? remoteQuery.isFetching && !remoteQuery.isFetchingNextPage
      : false,
    isFetchingNextPage: remoteEnabled ? remoteQuery.isFetchingNextPage : false,
    isError: remoteEnabled ? remoteQuery.isError : false,
    refetch: remoteQuery.refetch,
    fetchNextPage: remoteQuery.fetchNextPage,
    hasNextPage: remoteEnabled ? (remoteQuery.hasNextPage ?? false) : false,
  }
}
