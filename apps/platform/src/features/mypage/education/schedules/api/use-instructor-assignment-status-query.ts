import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchGeminiLectureSchedules } from '../../settlements/api/gemini-settlement-client'
import {
  mapGeminiLectureScheduleToInstructorItem,
  mapLectureReportAssignmentToInstructorItem,
  type InstructorAssignmentItem,
} from './instructor-assignment-client'
import { getAllLectureReportAssignments } from './lecture-report-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

const GEMINI_APPLICATION_TYPE = 'INSTRUCTOR'

type InstructorAssignmentStatusOptions = {
  /**
   * 제미나이 강사 신청 ID. 있으면 gemini-lecture-schedules 를 SSOT로 쓴다.
   * 제미나이 배정은 기관 신청 ID 없이 일정↔기관(OSA)으로 연결되어
   * lecture-report-assignments 에는 기관명·소재지가 비어 온다.
   */
  geminiApplicationId?: string | null
}

/**
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭 SSOT.
 *
 * - 제미나이: GET /api/portal/me/program-applications/INSTRUCTOR/{applicationId}/gemini-lecture-schedules
 * - 그 외: GET /api/portal/me/programs/{programId}/lecture-report-assignments
 * - instructor-assignments / instructor-assignment-waitings 는 호출하지 않는다.
 * - 대기 목록은 별도 계약이 없으므로 [] — assignment 부재로 대기 상태를 추론하지 않는다.
 * - API 오류는 빈 배열로 위장하지 않는다(isError로 구분).
 */
export function useInstructorAssignmentStatusQuery(
  programId: string | number | null | undefined,
  enabled = true,
  options: InstructorAssignmentStatusOptions = {},
) {
  const numericProgramId = parsePortalProgramId(programId == null ? undefined : String(programId))
  const geminiApplicationId = options.geminiApplicationId?.trim() ?? ''
  const isGemini = geminiApplicationId !== ''
  const remoteReady = enabled && isRemoteApiConfigured() && Boolean(getAccessToken())
  const programKey = String(numericProgramId ?? '')

  const assignmentsEnabled = remoteReady && !isGemini && numericProgramId != null
  const geminiEnabled =
    remoteReady && isGemini && Number.isFinite(Number(geminiApplicationId)) && Number(geminiApplicationId) > 0

  const assignmentsQuery = useQuery({
    queryKey: platformQueryKeys.mypage.lectureReportAssignments(programKey),
    queryFn: ({ signal }) => getAllLectureReportAssignments(numericProgramId!, signal),
    enabled: assignmentsEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  /** 정산 탭(useGeminiSettlementTabQuery)과 같은 키·같은 fetcher — 캐시를 공유한다. */
  const geminiQuery = useQuery({
    queryKey: platformQueryKeys.mypage.geminiLectureSchedules(
      GEMINI_APPLICATION_TYPE,
      geminiApplicationId,
    ),
    queryFn: ({ signal }) =>
      fetchGeminiLectureSchedules(GEMINI_APPLICATION_TYPE, geminiApplicationId, signal),
    enabled: geminiEnabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const activeQuery = isGemini ? geminiQuery : assignmentsQuery
  const queryEnabled = isGemini ? geminiEnabled : assignmentsEnabled

  const assignedItems: InstructorAssignmentItem[] = isGemini
    ? geminiQuery.isSuccess
      ? (geminiQuery.data ?? []).map(mapGeminiLectureScheduleToInstructorItem)
      : []
    : assignmentsQuery.isSuccess
      ? (assignmentsQuery.data ?? []).map(mapLectureReportAssignmentToInstructorItem)
      : []

  return {
    enabled: queryEnabled,
    isLoading: queryEnabled && activeQuery.isPending,
    isError: queryEnabled && activeQuery.isError,
    assignedItems,
    /** 배정 대기 API 없음 — 항상 []. 신청 displayStatus는 program-applications를 쓴다. */
    waitingItems: [] as const,
    hasAssignmentStatus: activeQuery.isSuccess && assignedItems.length > 0,
    refetch: () => activeQuery.refetch(),
  }
}
