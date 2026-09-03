import { useQuery } from '@tanstack/react-query'
import { getPerformanceRecordList } from '@/features/education-record/api/admin-performance-service'
import { performanceFilterSearchKey } from '@/features/education-record/api/performance-filter-params'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'
import { usePerformanceRemoteEnabled } from '@/features/education-record/hooks/use-performance-remote-enabled'

export function usePerformanceListQuery(searchParams: URLSearchParams, enabled = true) {
  const filterKey = performanceFilterSearchKey(searchParams)
  return useQuery({
    queryKey: performanceQueryKeys.list(filterKey),
    queryFn: () => getPerformanceRecordList(new URLSearchParams(filterKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export { usePerformanceRemoteEnabled }
