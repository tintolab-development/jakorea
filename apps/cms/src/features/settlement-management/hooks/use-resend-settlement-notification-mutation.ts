import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateSettlementLedgerCaches } from '@/features/settlement-management/api/invalidate-settlement-ledger-caches'
import {
  resendSettlementNotificationRemote,
  type SettlementNotificationResendRequestBody,
} from '@/features/settlement-management/api/settlement-api-client'

export function useResendSettlementNotificationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      settlementId: number
      body: SettlementNotificationResendRequestBody
      idempotencyKey: string
    }) => {
      await resendSettlementNotificationRemote(input.settlementId, input.body, input.idempotencyKey)
    },
    onSuccess: async () => {
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}
