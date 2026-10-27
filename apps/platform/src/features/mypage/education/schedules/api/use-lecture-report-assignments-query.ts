import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { getAllLectureReportAssignments } from './lecture-report-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

/**
 * 강사 배정현황 탭의 현재 포탈 SSOT.
 *
 * 현재 포탈 계약은 본인에게 배정된 강의보고서 대상 일정만 반환하므로,
 * 이 조회 결과가 있을 때만 배정현황 탭을 노출한다. 대기 일정은 별도 계약이
 * 추가되기 전까지 이 조회 결과로 추정하지 않는다.
 */
export function useLectureReportAssignmentsQuery(
  programId: string | number | null | undefined,
  enabled = true,
) {
  const numericProgramId = parsePortalProgramId(programId == null ? undefined : String(programId))
  const queryEnabled =
    enabled &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    numericProgramId != null

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.lectureReportAssignments(
      String(numericProgramId ?? ''),
    ),
    queryFn: ({ signal }) => getAllLectureReportAssignments(numericProgramId!, signal),
    enabled: queryEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    enabled: queryEnabled,
    isLoading: queryEnabled && query.isPending,
    isError: queryEnabled && query.isError,
    isSuccess: queryEnabled && query.isSuccess,
    items: query.isError ? [] : (query.data ?? []),
    hasAssignment: query.isSuccess && (query.data?.length ?? 0) > 0,
    refetch: query.refetch,
  }
}
