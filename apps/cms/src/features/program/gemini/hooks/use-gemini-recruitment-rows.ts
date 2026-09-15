import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentsQuery } from '../api/visiting-training/hooks'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'

/** API only — gate OFF면 빈 목록 */
export function useGeminiRecruitmentRows(): GeminiRecruitmentRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiRecruitmentsQuery(remoteEnabled)
  return remoteEnabled ? (remoteQuery.data ?? []) : []
}

export function useGeminiRecruitmentRowsQueryState() {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiRecruitmentsQuery(remoteEnabled)
  return {
    remoteEnabled,
    isFetching: remoteEnabled ? remoteQuery.isFetching : false,
    isError: remoteEnabled ? remoteQuery.isError : false,
    refetch: remoteQuery.refetch,
  }
}
