/**
 * 상세 쿼리 첫 응답 전 여부.
 * 캐시가 있으면 백그라운드 refetch 중이어도 false — 스피너로 본문을 가리지 않는다.
 * 비활성(disabled) 쿼리(`fetchStatus: 'idle'`)는 false — 스피너에 멈추지 않는다.
 */
export function isAwaitingFirstQueryData(query: {
  data: unknown
  isError: boolean
  isFetching: boolean
  fetchStatus?: 'fetching' | 'paused' | 'idle'
}): boolean {
  if (query.data != null || query.isError) return false
  if (query.fetchStatus === 'idle') return false
  return query.isFetching || query.fetchStatus === 'fetching' || query.fetchStatus === 'paused'
}
