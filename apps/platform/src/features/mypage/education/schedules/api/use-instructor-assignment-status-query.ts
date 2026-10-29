import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  getInstructorAssignmentWaitings,
  getInstructorAssignments,
} from './instructor-assignment-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

/**
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭 SSOT.
 *
 * - 배정된 목록: GET /api/portal/me/programs/{programId}/instructor-assignments
 * - 배정 대기 목록: GET /api/portal/me/programs/{programId}/instructor-assignment-waitings
 *
 * 두 목록 모두 서버 순서·값을 그대로 쓰고 FE에서 재필터링하지 않는다.
 * 탭은 배정된 목록 또는 대기 목록 중 하나라도 비어 있지 않을 때 노출한다.
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
    queryKey: platformQueryKeys.mypage.instructorAssignments(programKey),
    queryFn: ({ signal }) => getInstructorAssignments(numericProgramId!, signal),
    enabled: queryEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const waitingsQuery = useQuery({
    queryKey: platformQueryKeys.mypage.instructorAssignmentWaitings(programKey),
    queryFn: ({ signal }) => getInstructorAssignmentWaitings(numericProgramId!, signal),
    enabled: queryEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const assignedItems = assignmentsQuery.isError ? [] : (assignmentsQuery.data?.items ?? [])
  const waitingItems = waitingsQuery.isError ? [] : (waitingsQuery.data?.items ?? [])

  return {
    enabled: queryEnabled,
    isLoading: queryEnabled && (assignmentsQuery.isPending || waitingsQuery.isPending),
    isError: queryEnabled && (assignmentsQuery.isError || waitingsQuery.isError),
    assignedItems,
    waitingItems,
    hasAssignmentStatus:
      (assignmentsQuery.isSuccess && assignedItems.length > 0) ||
      (waitingsQuery.isSuccess && waitingItems.length > 0),
    refetch: () => Promise.all([assignmentsQuery.refetch(), waitingsQuery.refetch()]),
  }
}
