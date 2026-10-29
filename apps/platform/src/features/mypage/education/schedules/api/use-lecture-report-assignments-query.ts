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
 * 강의보고서·배정 현황 탭 SSOT.
 * GET /api/portal/me/programs/{programId}/lecture-report-assignments
 *
 * items: [] 는 배정 없음(정상). API 오류는 isError로 구분하고 빈 목록으로 위장하지 않는다.
 * 신청 대기 상태(결과 대기 등)는 program-applications.displayStatus를 쓴다.
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
    items: query.isSuccess ? (query.data ?? []) : [],
    hasAssignment: query.isSuccess && (query.data?.length ?? 0) > 0,
    refetch: query.refetch,
  }
}
