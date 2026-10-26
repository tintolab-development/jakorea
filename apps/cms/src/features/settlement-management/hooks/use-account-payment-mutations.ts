import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkMarkAccountPaymentsPaidRemote,
  markAccountPaymentFailedRemote,
  requestBulkTransferExportRemote,
  requestTaxReportExportRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { invalidateSettlementLedgerCaches } from '@/features/settlement-management/api/invalidate-settlement-ledger-caches'
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
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}

export function useMarkAccountPaymentFailedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) =>
      markAccountPaymentFailedRemote(paymentId, { reason: '계좌 지급 실패' }),
    onSuccess: async () => {
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}

/** R2 bulk-transfer export — 지급 대기(WAITING_PAYMENT) 기준 서버 생성 요청 */
export function useBulkTransferExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestBulkTransferExportRemote(body),
  })
}

/** R2 tax-report export — 지급 완료(PAID) 기준 서버 생성 요청 */
export function useTaxReportExportMutation() {
  return useMutation({
    mutationFn: (body: SettlementExportRequest) => requestTaxReportExportRemote(body),
  })
}
