import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentsQuery } from '../api/visiting-training/hooks'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

/** API only — gate OFF면 빈 목록 + 안내 alert */
export function useGeminiRecruitmentRows(): GeminiRecruitmentRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'gemini-recruitment-list',
    'Gemini 찾아가는 연수 · 모집 공고'
  )
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
