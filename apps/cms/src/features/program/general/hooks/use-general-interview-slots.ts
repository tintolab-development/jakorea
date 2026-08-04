import { useQuery } from '@tanstack/react-query'
import { listGeneralInterviewSlots } from '@/features/program/general/api/admin-applications-service'
import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { generalInterviewSlotsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

/**
 * remote ON: GET …/interview-slots. 실패·404 → data null → 호출부 mock 폴백.
 * remote OFF: 쿼리 비활성, data undefined.
 */
export function useGeneralInterviewSlots(programId: string, enabled = true) {
  const remote = shouldUseApplicationsHttpRemoteApi()
  return useQuery({
    queryKey: generalInterviewSlotsQueryKeys.list(programId),
    queryFn: () => listGeneralInterviewSlots(programId),
    enabled: Boolean(programId) && enabled && remote,
    staleTime: 30_000,
  })
}
