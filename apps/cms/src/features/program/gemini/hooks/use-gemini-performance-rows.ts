import { useSyncExternalStore } from 'react'
import { geminiPerformanceService } from '../api/performance-service'
import { shouldUseGeminiPerformanceRemoteApi } from '../api/performance-remote/capabilities'
import { useGeminiPerformanceListQuery } from '../api/performance-remote/hooks'
import type { GeminiPerformanceRow } from '../model/performance/types'

export function useGeminiPerformanceRows(): GeminiPerformanceRow[] {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const remoteQuery = useGeminiPerformanceListQuery(remoteEnabled)
  const localRows = useSyncExternalStore(
    geminiPerformanceService.subscribe,
    geminiPerformanceService.getSnapshot,
    geminiPerformanceService.getSnapshot
  )
  if (remoteEnabled) return remoteQuery.data ?? []
  return localRows
}

export function useGeminiPerformanceRowsQueryState() {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  const remoteQuery = useGeminiPerformanceListQuery(remoteEnabled)
  return {
    remoteEnabled,
    isFetching: remoteEnabled ? remoteQuery.isFetching : false,
    isError: remoteEnabled ? remoteQuery.isError : false,
    refetch: remoteQuery.refetch,
  }
}
