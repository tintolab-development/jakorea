import { useQuery } from '@tanstack/react-query'
import { getPerformanceRecordList } from '@/features/education-record/api/admin-performance-service'
import { performanceQueryKeys } from '@/features/education-record/api/performance-query-keys'
import { usePerformanceRemoteEnabled } from '@/features/education-record/hooks/use-performance-remote-enabled'

export function usePerformanceListQuery(enabled = true) {
  return useQuery({
    queryKey: performanceQueryKeys.list(),
    queryFn: () => getPerformanceRecordList(),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export { usePerformanceRemoteEnabled }
