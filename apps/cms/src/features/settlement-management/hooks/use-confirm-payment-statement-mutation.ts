import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkConfirmPaymentStatementsRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'

export type ConfirmPaymentStatementsInput = {
  statementIds: number[]
  lectureFeePaymentScheduledDate?: string
}

const BULK_CONFIRM_REASON = '지급조서 확인'

export function useConfirmPaymentStatementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ConfirmPaymentStatementsInput) => {
      const { statementIds, lectureFeePaymentScheduledDate } = input
      if (statementIds.length === 0) return

      await bulkConfirmPaymentStatementsRemote({
        statementIds,
        reason: BULK_CONFIRM_REASON,
        ...(lectureFeePaymentScheduledDate
          ? {
              lectureFeePaymentScheduledDate,
              scheduledPaymentDate: lectureFeePaymentScheduledDate,
            }
          : {}),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.lists() }),
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.statements() }),
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.details() }),
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.calendar.all() }),
      ])
    },
  })
}
