/**
 * 관리자 전체 통계 데이터 로드 훅
 * Dashboard 페이지의 통계 useEffect를 분리 (비즈니스 로직 동일)
 */

import { useQuery } from '@tanstack/react-query'
import { getOverallStatistics } from '@/features/dashboard/api/statistics-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

export function useOverallStatistics(isAdmin: boolean) {
  const scope = useDashboardQueryScope()

  const query = useQuery({
    queryKey: dashboardQueryKeys.overallStatistics(scope),
    queryFn: () => getOverallStatistics(),
    enabled: isAdmin,
    staleTime: 60_000,
  })

  return { data: query.data ?? null, loading: query.isLoading }
}
