import { useSyncExternalStore } from 'react'
import { geminiRecruitmentService } from '../api/recruitment-service'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentsQuery } from '../api/visiting-training/hooks'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'

export function useGeminiRecruitmentRows(): GeminiRecruitmentRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiRecruitmentsQuery(remoteEnabled)
  const localRows = useSyncExternalStore(
    geminiRecruitmentService.subscribe,
    geminiRecruitmentService.getSnapshot,
    geminiRecruitmentService.getSnapshot
  )
  if (remoteEnabled) return remoteQuery.data ?? []
  return localRows
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
