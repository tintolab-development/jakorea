import { useGeminiApprovedTrainingDetailQuery } from '../api/visiting-training/hooks'
import type { GeminiApprovedTrainingDetail } from '../model/approved/detail-types'

export function useGeminiApprovedTrainingDetail(approvedTrainingId: string): {
  detail: GeminiApprovedTrainingDetail | null
  isLoading: boolean
  isError: boolean
  error: unknown
  isRefetching: boolean
  refetch: () => void
} {
  const enabled = Boolean(approvedTrainingId.trim())
  const query = useGeminiApprovedTrainingDetailQuery(approvedTrainingId, enabled)

  return {
    detail: query.data ?? null,
    isLoading: enabled && query.isPending && query.data == null,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isFetching && !query.isPending,
    refetch: () => {
      void query.refetch()
    },
  }
}
