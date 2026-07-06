import { useSyncExternalStore } from 'react'
import { geminiRecruitmentService } from '../api/recruitment-service'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'

export function useGeminiRecruitmentRows(): GeminiRecruitmentRow[] {
  return useSyncExternalStore(
    geminiRecruitmentService.subscribe,
    geminiRecruitmentService.getSnapshot,
    geminiRecruitmentService.getSnapshot
  )
}
