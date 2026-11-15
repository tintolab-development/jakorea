import { useQuery } from '@tanstack/react-query'
import { listGeneralInterviewSlots } from '@/features/program/general/api/admin-applications-service'
import { shouldUseRemoteInterviewSchedule } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import { generalInterviewSlotsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import type { InterviewSlotAudience } from '@/features/program/general/api/applications-api-client'

/**
 * remote 실제 프로그램 + 신청 remote ON일 때만 GET …/interview-slots?audience=….
 * 신청 목록이 mock이면 쿼리 비활성(호출부 mock 스케줄).
 * 배정 화면은 대상(`audience`)별 슬롯만 쓴다 — 참여자는 PARTICIPANT, 봉사자는 VOLUNTEER.
 */
export function useGeneralInterviewSlots(
  programId: string,
  enabled = true,
  options?: { applicationsUseRemote?: boolean; audience?: InterviewSlotAudience }
) {
  const remote = shouldUseRemoteInterviewSchedule(programId, options)
  const audience = options?.audience ?? 'VOLUNTEER'
  return useQuery({
    queryKey: generalInterviewSlotsQueryKeys.listByAudience(programId, audience),
    queryFn: () => listGeneralInterviewSlots(programId, { audience }),
    enabled: Boolean(programId) && enabled && remote,
    staleTime: 30_000,
  })
}
