import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentsQuery } from '../api/visiting-training/hooks'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export type GeminiRecruitmentQueryFilters = {
  title?: string
  status?: string
  from?: string
  to?: string
}

/** API only — gate OFF면 빈 목록 + 안내 alert */
export function useGeminiRecruitmentRows(
  filters: GeminiRecruitmentQueryFilters
): GeminiRecruitmentRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'gemini-recruitment-list',
    'Gemini 찾아가는 연수 · 모집 공고'
  )
  const remoteQuery = useGeminiRecruitmentsQuery(filters, remoteEnabled)
  return remoteEnabled
    ? (remoteQuery.data?.pages.flatMap(page => page.rows) ?? [])
    : []
}

export function useGeminiRecruitmentRowsQueryState(
  filters: GeminiRecruitmentQueryFilters
) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiRecruitmentsQuery(filters, remoteEnabled)
  return {
    remoteEnabled,
    isFetching: remoteEnabled
      ? remoteQuery.isFetching && !remoteQuery.isFetchingNextPage
      : false,
    isFetchingNextPage: remoteEnabled ? remoteQuery.isFetchingNextPage : false,
    isError: remoteEnabled ? remoteQuery.isError : false,
    refetch: remoteQuery.refetch,
    fetchNextPage: remoteQuery.fetchNextPage,
    hasNextPage: remoteEnabled ? (remoteQuery.hasNextPage ?? false) : false,
    totalElements: remoteEnabled
      ? (remoteQuery.data?.pages[0]?.totalElements ?? 0)
      : 0,
  }
}
