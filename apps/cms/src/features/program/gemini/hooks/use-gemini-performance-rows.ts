import { useMemo } from 'react'
import { shouldUseGeminiPerformanceRemoteApi } from '../api/performance-remote/capabilities'
import { useGeminiPerformanceListQuery } from '../api/performance-remote/hooks'
import type { GeminiPerformanceListQueryFilters } from '../api/performance-remote/query-keys'
import type { GeminiPerformanceRow } from '../model/performance/types'

const EMPTY_ROWS: GeminiPerformanceRow[] = []

export type GeminiPerformanceRowsResult = {
  rows: GeminiPerformanceRow[]
  remoteEnabled: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isError: boolean
  refetch: () => unknown
  fetchNextPage: () => unknown
  hasNextPage: boolean
  totalElements: number
}

/** API only — gate OFF면 빈 목록. size=20 infinite */
export function useGeminiPerformanceRows(
  filters: GeminiPerformanceListQueryFilters = {}
): GeminiPerformanceRowsResult {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const remoteQuery = useGeminiPerformanceListQuery(filters, remoteEnabled)
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

/** @deprecated use useGeminiPerformanceRows().rows */
export function useGeminiPerformanceRowsQueryState(
  filters: GeminiPerformanceListQueryFilters = {}
) {
  const state = useGeminiPerformanceRows(filters)
  return {
    remoteEnabled: state.remoteEnabled,
    isFetching: state.isFetching,
    isFetchingNextPage: state.isFetchingNextPage,
    isError: state.isError,
    refetch: state.refetch,
    fetchNextPage: state.fetchNextPage,
    hasNextPage: state.hasNextPage,
    totalElements: state.totalElements,
  }
}
