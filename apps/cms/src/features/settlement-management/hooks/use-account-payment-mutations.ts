import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import {
  markAccountPaymentFailedRemote,
  markAccountPaymentPaidRemote,
  requestBulkTransferExportRemote,
  requestTaxReportExportRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'

export function useMarkAccountPaymentPaidMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentIds: number[]) => {
      const errors: string[] = []
      for (const paymentId of paymentIds) {
        try {
          await markAccountPaymentPaidRemote(paymentId)
        } catch (error) {
          errors.push(getSettlementApiErrorMessage(error, `지급 완료 처리 실패 (ID: ${paymentId})`))
        }
      }
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }
    },
    onSuccess: async () => {
      await invalidateAccountPaymentCaches(queryClient)
    },
  })
}

export function useMarkAccountPaymentFailedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) => markAccountPaymentFailedRemote(paymentId),
    onSuccess: async () => {
      await invalidateAccountPaymentCaches(queryClient)
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

function invalidateAccountPaymentCaches(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.lists() }),
    queryClient.invalidateQueries({ queryKey: settlementQueryKeys.accountPayments.details() }),
  ])
}
