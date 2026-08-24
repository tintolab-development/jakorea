import { useMutation, useQueryClient } from '@tanstack/react-query'
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
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKeys.accountPayments.all(),
      })
    },
  })
}

export function useMarkAccountPaymentFailedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) =>
      markAccountPaymentFailedRemote(paymentId, { reason: '계좌 지급 실패' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKeys.accountPayments.all(),
      })
    },
  })
}

export function useBulkTransferExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestBulkTransferExportRemote(body),
  })
}

export function useTaxReportExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestTaxReportExportRemote(body),
  })
}
