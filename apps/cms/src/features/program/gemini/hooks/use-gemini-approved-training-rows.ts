import { useSyncExternalStore } from 'react'
import { geminiApprovedTrainingService } from '../api/approved-training-service'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiApprovedTrainingsQuery } from '../api/visiting-training/hooks'
import type { GeminiApprovedTrainingRow } from '../model/approved/types'

export function useGeminiApprovedTrainingRows(): GeminiApprovedTrainingRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(remoteEnabled)
  const localRows = useSyncExternalStore(
    geminiApprovedTrainingService.subscribe,
    geminiApprovedTrainingService.getSnapshot,
    geminiApprovedTrainingService.getSnapshot
  )
  if (remoteEnabled) return remoteQuery.data ?? []
  return localRows
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
