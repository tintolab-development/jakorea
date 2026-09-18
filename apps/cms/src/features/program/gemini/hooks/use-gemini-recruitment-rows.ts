import { useMemo } from 'react'
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

const EMPTY_ROWS: GeminiRecruitmentRow[] = []

export type GeminiRecruitmentRowsResult = {
  rows: GeminiRecruitmentRow[]
  remoteEnabled: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isError: boolean
  refetch: () => unknown
  fetchNextPage: () => unknown
  hasNextPage: boolean
  totalElements: number
}

/**
 * 모집 공고 목록 — 단일 infinite query 구독.
 * (rows + queryState를 각각 호출하면 trim effect·observer가 이중으로 붙는다.)
 */
export function useGeminiRecruitmentRows(
  filters: GeminiRecruitmentQueryFilters
): GeminiRecruitmentRowsResult {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'gemini-recruitment-list',
    'Gemini 찾아가는 연수 · 모집 공고'
  )
  const remoteQuery = useGeminiRecruitmentsQuery(filters, remoteEnabled)
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
