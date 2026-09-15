import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiApprovedTrainingsQuery } from '../api/visiting-training/hooks'
import type { GeminiApprovedTrainingRow } from '../model/approved/types'

/** API only — gate OFF면 빈 목록 */
export function useGeminiApprovedTrainingRows(): GeminiApprovedTrainingRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(remoteEnabled)
  return remoteEnabled ? (remoteQuery.data ?? []) : []
}

export function useGeminiApprovedTrainingRowsQueryState() {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(remoteEnabled)
  return {
    remoteEnabled,
    isFetching: remoteEnabled ? remoteQuery.isFetching : false,
    isError: remoteEnabled ? remoteQuery.isError : false,
    refetch: remoteQuery.refetch,
  }
}
