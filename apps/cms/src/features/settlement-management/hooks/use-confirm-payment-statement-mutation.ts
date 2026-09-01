import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkConfirmPaymentStatementsRemote,
  rejectPaymentStatementRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { invalidateSettlementLedgerCaches } from '@/features/settlement-management/api/invalidate-settlement-ledger-caches'
import type { PaymentOrderRejectNotificationType } from '@/features/settlement/lib/payment-order-reject-notification'

export type ConfirmPaymentStatementsInput = {
  statementIds: number[]
  lectureFeePaymentScheduledDate?: string
}

export type RejectPaymentStatementInput = {
  statementId: number
  reason: string
  notificationType: PaymentOrderRejectNotificationType
  scheduledNotificationAt?: string
}

const BULK_CONFIRM_REASON = '지급조서 확인'
const REJECT_REASON_FALLBACK = '신청 반려'

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
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}

export function useRejectPaymentStatementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RejectPaymentStatementInput) => {
      await rejectPaymentStatementRemote(input.statementId, {
        reason: input.reason.trim() || REJECT_REASON_FALLBACK,
        notificationType: input.notificationType,
        ...(input.scheduledNotificationAt
          ? { scheduledNotificationAt: input.scheduledNotificationAt }
          : {}),
      })
    },
    onSuccess: async () => {
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}
