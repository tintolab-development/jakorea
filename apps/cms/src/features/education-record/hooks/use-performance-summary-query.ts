import { useQuery } from '@tanstack/react-query'
import { getPerformanceSummaryTabView } from '@/features/education-record/api/admin-performance-service'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'

/** Class C — 합계 탭 집계. staleTime 30s. */
export function usePerformanceSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: performanceQueryKeys.summary(),
    queryFn: () => getPerformanceSummaryTabView(),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
