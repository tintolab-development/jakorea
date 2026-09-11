import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderAdminProcessingStatus,
} from '@/data/mock/payment-order-admin-list'
import type { AccountPaymentTransferStatus } from '@/data/mock/account-payments-list'

/** API statementStatus → UI 지급조서 처리 현황 */
export function mapStatementStatusToProcessingStatus(
  status: string | undefined
): PaymentOrderAdminProcessingStatus {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
    case 'CORRECTION_REQUESTED':
      return 'correction'
    case 'REJECTED':
      return 'application_rejected'
    case 'REAPPLICATION':
    case 'RESUBMITTED':
      return 'reapplication'
    case 'PARTIAL':
    case 'PARTIAL_CONFIRMED':
      return 'partial'
    case 'WAITING_CONFIRM':
    case 'ISSUED':
    case 'REQUESTED':
    default:
      return 'pending'
  }
}

/** API statementStatus → UI 라인 처리 현황 */
export function mapStatementStatusToLineStatus(
  status: string | undefined
): PaymentOrderAdminLineProcessingStatus {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
    case 'CORRECTION_REQUESTED':
      return 'correction'
    case 'REJECTED':
      return 'application_rejected'
    case 'PAID':
      return 'rejected'
    case 'REAPPLICATION':
    case 'RESUBMITTED':
      return 'reapplication'
    case 'WAITING_CONFIRM':
    case 'ISSUED':
    case 'REQUESTED':
    default:
      return 'pending'
  }
}

/** API paymentStatus → 계좌 지급 UI 상태 */
export function mapPaymentStatusToAccountPaymentStatus(
  status: string | undefined
): AccountPaymentTransferStatus {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'account_paid'
    case 'CORRECTION_REQUESTED':
      return 'payment_correction_requested'
    case 'CONFIRMED':
      return 'partial_confirmation'
    /** BE canonical 대기값. REQUESTED는 대기 버킷 alias(지급조서 REQUESTED와 이름 겹침 — 위장 매핑 금지, 동일 UI만) */
    case 'WAITING_PAYMENT':
    case 'FAILED':
    case 'REQUESTED':
    default:
      return 'awaiting_confirmation'
  }
}

export function isPendingStatementStatus(status: string | undefined): boolean {
  const upper = status?.toUpperCase()
  return (
    upper === 'REQUESTED' ||
    upper === 'REAPPLICATION' ||
    upper === 'RESUBMITTED' ||
    upper === 'WAITING_CONFIRM' ||
    upper === 'ISSUED' ||
    upper === undefined ||
    upper === ''
  )
}

/**
 * BE bulk-confirm 확인 가능 상태 (2026-09-11 회신).
 * `WAITING_CONFIRM` | `REQUESTED` | `REAPPLICATION` | `ISSUED`
 * (`RESUBMITTED`는 REAPPLICATION alias로 허용)
 */
export function isConfirmableStatementStatus(status: string | undefined): boolean {
  const upper = status?.toUpperCase()
  return (
    upper === 'WAITING_CONFIRM' ||
    upper === 'REQUESTED' ||
    upper === 'REAPPLICATION' ||
    upper === 'RESUBMITTED' ||
    upper === 'ISSUED'
  )
}
