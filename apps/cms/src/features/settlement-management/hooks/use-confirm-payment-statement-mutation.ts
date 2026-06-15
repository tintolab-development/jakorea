import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { confirmPaymentStatementRemote } from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'

export function useConfirmPaymentStatementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (statementIds: number[]) => {
      const errors: string[] = []
      for (const statementId of statementIds) {
        try {
          await confirmPaymentStatementRemote(statementId)
        } catch (error) {
          errors.push(getSettlementApiErrorMessage(error, `지급조서 확인 실패 (ID: ${statementId})`))
        }
      }
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.all() }),
        queryClient.invalidateQueries({ queryKey: settlementQueryKeys.calendar.all() }),
      ])
    },
  })
}
