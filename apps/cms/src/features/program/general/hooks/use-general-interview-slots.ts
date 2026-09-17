import { useQuery } from '@tanstack/react-query'
import { listGeneralInterviewSlots } from '@/features/program/general/api/admin-applications-service'
import { shouldUseRemoteInterviewSchedule } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import { generalInterviewSlotsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

/**
 * remote 실제 프로그램 + 신청 remote ON일 때만 GET …/interview-slots.
 * 신청 목록이 mock이면 쿼리 비활성(호출부 mock 스케줄).
 */
export function useGeneralInterviewSlots(
  programId: string,
  enabled = true,
  options?: { applicationsUseRemote?: boolean }
) {
  const remote = shouldUseRemoteInterviewSchedule(programId, options)
  return useQuery({
    queryKey: generalInterviewSlotsQueryKeys.list(programId),
    queryFn: () => listGeneralInterviewSlots(programId),
    enabled: Boolean(programId) && enabled && remote,
    staleTime: 30_000,
  })
}
