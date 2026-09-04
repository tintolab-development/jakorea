import { useQuery } from '@tanstack/react-query'
import { getPerformanceSummaryTabView } from '@/features/education-record/api/admin-performance-service'
import { performanceFilterSearchKey } from '@/features/education-record/api/performance-filter-params'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'

/** Class C — 합계 탭 집계. staleTime 30s. 목록과 동일 솔팅 키. */
export function usePerformanceSummaryQuery(searchParams: URLSearchParams, enabled = true) {
  const filterKey = performanceFilterSearchKey(searchParams)
  return useQuery({
    queryKey: performanceQueryKeys.summary(filterKey),
    queryFn: () => getPerformanceSummaryTabView(new URLSearchParams(filterKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
