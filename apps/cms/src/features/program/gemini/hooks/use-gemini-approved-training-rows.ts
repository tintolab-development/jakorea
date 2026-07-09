import { useSyncExternalStore } from 'react'
import { geminiApprovedTrainingService } from '../api/approved-training-service'
import type { GeminiApprovedTrainingRow } from '../model/approved/types'

export function useGeminiApprovedTrainingRows(): GeminiApprovedTrainingRow[] {
  return useSyncExternalStore(
    geminiApprovedTrainingService.subscribe,
    geminiApprovedTrainingService.getSnapshot,
    geminiApprovedTrainingService.getSnapshot
  )
}
