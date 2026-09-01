/**
 * 데이터 관리 목록의 **최초 로드** 여부.
 * `placeholderData: keepPreviousData` 사용 시 필터 refetch 중에는 data가 유지되므로
 * 풀스크린 Spin 대신 테이블을 유지한다.
 */
export function isDataManagementListLoading(query: {
  data: unknown
  isError: boolean
  /** TanStack Query v5 — 캐시·placeholder 없으면 true */
  isPending?: boolean
}): boolean {
  if (query.isError) return false
  if (typeof query.isPending === 'boolean') {
    return query.isPending
  }
  return query.data === undefined
}
