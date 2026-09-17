import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiApprovedTrainingsQuery } from '../api/visiting-training/hooks'
import type { GeminiApprovedTrainingRow } from '../model/approved/types'

export type GeminiApprovedTrainingQueryFilters = {
  institutionName?: string
  institutionSido?: string
  institutionSigungu?: string
  status?: string
  officialDocumentRequired?: string
  trainingDateFrom?: string
  trainingDateTo?: string
}

/** API only — gate OFF면 빈 목록 */
export function useGeminiApprovedTrainingRows(
  filters: GeminiApprovedTrainingQueryFilters
): GeminiApprovedTrainingRow[] {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(filters, remoteEnabled)
  return remoteEnabled
    ? (remoteQuery.data?.pages.flatMap(page => page.rows) ?? [])
    : []
}

export function useGeminiApprovedTrainingRowsQueryState(
  filters: GeminiApprovedTrainingQueryFilters
) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(filters, remoteEnabled)
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
