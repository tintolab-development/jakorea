import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  approveIndividualSettlementReviewRemote,
  individualSettlementReviewDetailQueryOptions,
  isIndividualSettlementReviewConflict,
  rejectIndividualSettlementReviewRemote,
} from '@/features/program/general/api/individual-settlement-review-remote'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

export function useIndividualSettlementReviewMutations(input: {
  programId: string
  participantId: string
  settlementApplicationId: number | null
  onReviewed?: () => Promise<void> | void
}) {
  const queryClient = useQueryClient()

  const refetchReviewQueries = async () => {
    const tasks: Promise<unknown>[] = [
      queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.individualSettlementReviews(
          input.programId,
          input.participantId
        ),
      }),
    ]
    if (input.settlementApplicationId != null) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: individualSettlementReviewDetailQueryOptions(input.settlementApplicationId)
            .queryKey,
        })
      )
    }
    await Promise.all(tasks)
    await input.onReviewed?.()
  }

  const approveMutation = useMutation({
    mutationFn: approveIndividualSettlementReviewRemote,
    onSuccess: refetchReviewQueries,
    onError: async error => {
      if (isIndividualSettlementReviewConflict(error)) {
        await refetchReviewQueries()
      }
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectIndividualSettlementReviewRemote,
    onSuccess: refetchReviewQueries,
    onError: async error => {
      if (isIndividualSettlementReviewConflict(error)) {
        await refetchReviewQueries()
      }
    },
  })

  return { approveMutation, rejectMutation, refetchReviewQueries }
}
