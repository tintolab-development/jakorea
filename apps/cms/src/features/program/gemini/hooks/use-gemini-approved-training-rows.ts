import { useMemo } from 'react'
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

const EMPTY_ROWS: GeminiApprovedTrainingRow[] = []

export type GeminiApprovedTrainingRowsResult = {
  rows: GeminiApprovedTrainingRow[]
  remoteEnabled: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isError: boolean
  refetch: () => unknown
  fetchNextPage: () => unknown
  hasNextPage: boolean
  totalElements: number
}

/** 승인 연수 목록 — 단일 infinite query 구독 */
export function useGeminiApprovedTrainingRows(
  filters: GeminiApprovedTrainingQueryFilters
): GeminiApprovedTrainingRowsResult {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiApprovedTrainingsQuery(filters, remoteEnabled)
  const rows = useMemo(
    () =>
      remoteEnabled
        ? (remoteQuery.data?.pages.flatMap(page => page.rows) ?? EMPTY_ROWS)
        : EMPTY_ROWS,
    [remoteEnabled, remoteQuery.data]
  )

  return {
    rows,
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
