import { useGeminiApprovedTrainingDetailQuery } from '../api/visiting-training/hooks'
import type { GeminiApprovedTrainingDetail } from '../model/approved/detail-types'

export function useGeminiApprovedTrainingDetail(approvedTrainingId: string): {
  detail: GeminiApprovedTrainingDetail | null
  isLoading: boolean
  isError: boolean
} {
  const enabled = Boolean(approvedTrainingId.trim())
  const query = useGeminiApprovedTrainingDetailQuery(approvedTrainingId, enabled)

  return {
    detail: query.data ?? null,
    isLoading: enabled && query.isPending && query.data == null,
    isError: query.isError,
  }
}
