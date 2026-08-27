import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  bulkMarkAccountPaymentsPaidRemote,
  markAccountPaymentFailedRemote,
  requestBulkTransferExportRemote,
  requestTaxReportExportRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'

const BULK_PAID_REASON = '계좌 지급 완료'

export function useMarkAccountPaymentPaidMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentIds: number[]) => {
      if (paymentIds.length === 0) return
      await bulkMarkAccountPaymentsPaidRemote({
        paymentIds,
        reason: BULK_PAID_REASON,
      })
    },
    onSuccess: async () => {
      await invalidateAccountPaymentCaches(queryClient)
    },
  })
}

export function useMarkAccountPaymentFailedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) =>
      markAccountPaymentFailedRemote(paymentId, { reason: '계좌 지급 실패' }),
    onSuccess: async () => {
      await invalidateAccountPaymentCaches(queryClient)
    },
  })
}

/** P1 export — 화면 Client Excel SSOT. 훅은 유지하되 account-payments UI에서 호출하지 않음. */
export function useBulkTransferExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestBulkTransferExportRemote(body),
  })
}

/** P1 export — 화면 Client Excel SSOT. 훅은 유지하되 account-payments UI에서 호출하지 않음. */
export function useTaxReportExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestTaxReportExportRemote(body),
  })
}

function invalidateAccountPaymentCaches(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.lists() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.details() }),
    queryClient.invalidateQueries({
      queryKey: [...settlementQueryKeys.accountPayments.all(), 'budgetSummary'],
    }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.lists() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.details() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.paymentOrders.statements() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.calendar.all() }),
  ])
}
