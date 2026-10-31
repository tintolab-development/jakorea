import { useQuery } from '@tanstack/react-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { fetchUjatPartnerRecommendation } from '@/features/program/ujat/api/education-execution-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { partnerOptionsFromRecommendation } from './volunteer-assign-modal-data'

/**
 * 파트너 배정 모달 후보.
 * Class E: 같은 일정 배정이 바뀌면 추천도 바뀌므로 staleTime 30초.
 */
export function usePartnerRecommendationOptions(input: {
  programId: string
  scheduleId?: number | null
  organizationApplicationId?: number | null
  enabled: boolean
}) {
  const scheduleId = input.scheduleId
  const remoteEnabled =
    input.enabled &&
    shouldUseUjatApplicationsRemoteApi() &&
    Boolean(input.programId) &&
    scheduleId != null

  const query = useQuery({
    queryKey: ujatQueryKeys.partnerRecommendation(
      input.programId,
      String(scheduleId ?? ''),
      input.organizationApplicationId
    ),
    enabled: remoteEnabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () =>
      fetchUjatPartnerRecommendation(
        input.programId,
        scheduleId as number,
        input.organizationApplicationId ?? undefined
      ),
  })

  return {
    partnerOptions: partnerOptionsFromRecommendation(query.data),
    isLoading: remoteEnabled && query.isLoading,
  }
}
