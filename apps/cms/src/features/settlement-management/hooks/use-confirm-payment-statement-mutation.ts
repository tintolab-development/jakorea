import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  approveSettlementCorrectionRemote,
  bulkConfirmPaymentStatementsRemote,
  rejectPaymentStatementRemote,
  rejectSettlementCorrectionRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { invalidateSettlementLedgerCaches } from '@/features/settlement-management/api/invalidate-settlement-ledger-caches'
import type {
  IndividualSettlementApprovalTarget,
  InstructorSettlementBulkConfirmTarget,
  SettlementCorrectionApprovalRequest,
} from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrderRejectNotificationType } from '@/features/settlement/lib/payment-order-reject-notification'

export type ConfirmPaymentStatementsInput = {
  statementIds: number[]
  lectureFeePaymentScheduledDate?: string
  /** 영수증(참여자·봉사자) 승인 대상 — 강사 지급조서와 한 트랜잭션(전체 성공 또는 전체 롤백) */
  individualSettlementApplications?: IndividualSettlementApprovalTarget[]
  /** 확정 전 강사 정산 신청서 — 신청서 승인 + 지급조서 확인을 같은 트랜잭션에서 처리 */
  instructorSettlementApplications?: InstructorSettlementBulkConfirmTarget[]
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
      const {
        statementIds,
        lectureFeePaymentScheduledDate,
        individualSettlementApplications = [],
        instructorSettlementApplications = [],
      } = input
      if (
        statementIds.length === 0 &&
        individualSettlementApplications.length === 0 &&
        instructorSettlementApplications.length === 0
      ) {
        return
      }

      await bulkConfirmPaymentStatementsRemote({
        statementIds,
        ...(individualSettlementApplications.length > 0 ? { individualSettlementApplications } : {}),
        ...(instructorSettlementApplications.length > 0 ? { instructorSettlementApplications } : {}),
        reason: BULK_CONFIRM_REASON,
        // BE: scheduledPaymentDate 우선, 없으면 lectureFeePaymentScheduledDate — 동일 값 dual 전송
        // 날짜 없으면 400 SCHEDULED_PAYMENT_DATE_REQUIRED. 트랜잭션 all-or-nothing.
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

/** 산출 내역서 「지급 정정」 — 정정 요청 승인(재산정) */
export function useApproveSettlementCorrectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      correctionRequestId: number
      body: SettlementCorrectionApprovalRequest
    }) => approveSettlementCorrectionRemote(input.correctionRequestId, input.body),
    onSuccess: async () => {
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}

/** 산출 내역서 「신청 반려」(지급 정정 요청 상태) — 정정 요청 반려 */
export function useRejectSettlementCorrectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { correctionRequestId: number; reason: string }) =>
      rejectSettlementCorrectionRemote(input.correctionRequestId, input.reason.trim()),
    onSuccess: async () => {
      await invalidateSettlementLedgerCaches(queryClient)
    },
  })
}
