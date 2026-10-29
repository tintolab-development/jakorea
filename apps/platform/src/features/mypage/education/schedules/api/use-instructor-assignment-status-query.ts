import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { mapLectureReportAssignmentToInstructorItem } from './instructor-assignment-client'
import { getAllLectureReportAssignments } from './lecture-report-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

/**
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭 SSOT.
 *
 * - 배정된 목록: GET /api/portal/me/programs/{programId}/lecture-report-assignments
 * - instructor-assignments / instructor-assignment-waitings 는 호출하지 않는다.
 * - 대기 목록은 별도 계약이 없으므로 [] — assignment 부재로 대기 상태를 추론하지 않는다.
 * - API 오류는 빈 배열로 위장하지 않는다(isError로 구분).
 */
export function useInstructorAssignmentStatusQuery(
  programId: string | number | null | undefined,
  enabled = true,
) {
  const numericProgramId = parsePortalProgramId(programId == null ? undefined : String(programId))
  const queryEnabled =
    enabled &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    numericProgramId != null
  const programKey = String(numericProgramId ?? '')

  const assignmentsQuery = useQuery({
    queryKey: platformQueryKeys.mypage.lectureReportAssignments(programKey),
    queryFn: ({ signal }) => getAllLectureReportAssignments(numericProgramId!, signal),
    enabled: queryEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const assignedItems = assignmentsQuery.isSuccess
    ? (assignmentsQuery.data ?? []).map(mapLectureReportAssignmentToInstructorItem)
    : []

  return {
    enabled: queryEnabled,
    isLoading: queryEnabled && assignmentsQuery.isPending,
    isError: queryEnabled && assignmentsQuery.isError,
    assignedItems,
    /** 배정 대기 API 없음 — 항상 []. 신청 displayStatus는 program-applications를 쓴다. */
    waitingItems: [] as const,
    hasAssignmentStatus: assignmentsQuery.isSuccess && assignedItems.length > 0,
    refetch: () => assignmentsQuery.refetch(),
  }
}
