import type { QueryClient, QueryKey } from '@tanstack/react-query'

function observerCount(queryClient: QueryClient, queryKey: QueryKey): number {
  return queryClient.getQueryCache().find({ queryKey, exact: true })?.getObserversCount() ?? 0
}

/**
 * 삭제된 상세 캐시를 제거한다.
 * observer가 있으면 removeQueries가 같은 키를 다시 GET 하므로 건너뛴다.
 * @returns 캐시를 제거했으면 true
 */
export function discardDeletedDetailQuery(
  queryClient: QueryClient,
  queryKey: QueryKey
): boolean {
  void queryClient.cancelQueries({ queryKey, exact: true })
  if (observerCount(queryClient, queryKey) > 0) return false
  queryClient.removeQueries({ queryKey, exact: true })
  return true
}
