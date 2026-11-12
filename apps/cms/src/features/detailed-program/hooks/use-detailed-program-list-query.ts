import { getDetailedProgramListPage } from '@/features/detailed-program/api/admin-detailed-programs-service'
import { serializeDetailedProgramListFilters } from '@/features/detailed-program/api/detailed-program-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { useInfiniteLogList } from '@/features/logs/hooks/use-infinite-log-list'

/**
 * 세부 프로그램 목록 — 교재·후원사 목록과 같은 서버 페이지 + 스크롤 추가 로드 (QA-0363).
 * 캐시 갱신은 `query-list-cache`가 무한 목록 형태도 처리한다.
 */
export function useDetailedProgramListQuery(searchParams: URLSearchParams, enabled = true) {
  const listFilterKey = serializeDetailedProgramListFilters(searchParams)
  const remoteEnabled = useDataManagementRemoteEnabled('detailedPrograms', enabled)

  return useInfiniteLogList({
    queryKey: dataManagementQueryKeys.detailedPrograms.list(listFilterKey),
    queryKeyIdentity: listFilterKey,
    queryFn: page => getDetailedProgramListPage(new URLSearchParams(listFilterKey), page),
    enabled: remoteEnabled,
  })
}
