import { useSyncExternalStore } from 'react'
import { geminiPerformanceService } from '../api/performance-service'
import type { GeminiPerformanceRow } from '../model/performance/types'

export function useGeminiPerformanceRows(): GeminiPerformanceRow[] {
  return useSyncExternalStore(
    geminiPerformanceService.subscribe,
    geminiPerformanceService.getSnapshot,
    geminiPerformanceService.getSnapshot
  )
}
