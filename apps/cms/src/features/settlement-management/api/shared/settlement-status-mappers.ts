import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderAdminProcessingStatus,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { AccountPaymentTransferStatus } from '@/features/settlement-management/model/account-payments-list'

/** BE settlement/payment-statement availableActions */
export const CONFIRM_PAYMENT_STATEMENT_ACTION = 'CONFIRM_PAYMENT_STATEMENT'

/** API statementStatus → UI 지급조서 처리 현황 */
export function mapStatementStatusToProcessingStatus(
  status: string | null | undefined
): PaymentOrderAdminProcessingStatus {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
    // DRAFT = 정정 승인 후 강사 재신청 대기. 확인 불가, 재신청 전까지 "지급 정정 요청"으로 본다
    case 'CORRECTION_REQUESTED':
    case 'DRAFT':
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

/** API statementStatus → UI 라인 처리 현황 (paymentStatus 축 무시 — 복합 매핑은 `mapSettlementAxesToLineStatus`) */
export function mapStatementStatusToLineStatus(
  status: string | null | undefined
): PaymentOrderAdminLineProcessingStatus {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
    // DRAFT = 정정 승인 후 강사 재신청 대기. 확인 불가, 재신청 전까지 "지급 정정 요청"으로 본다
    case 'CORRECTION_REQUESTED':
    case 'DRAFT':
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

/**
 * statementStatus + paymentStatus 축으로 라인 라벨 매핑.
 * `CONFIRMED` + `WAITING_PAYMENT` → `awaiting_payment`(라벨 「지급조서 확인 완료」 — 지급조서 갈래 정의).
 * `frontendStatus`/`payment_pending` 문자열로 「확인 대기 중」을 추론하지 않는다.
 */
export function mapSettlementAxesToLineStatus(
  statementStatus: string | null | undefined,
  paymentStatus: string | null | undefined
): PaymentOrderAdminLineProcessingStatus {
  const statement = statementStatus?.toUpperCase()
  const payment = paymentStatus?.toUpperCase()
  if (statement === 'CONFIRMED' && payment === 'WAITING_PAYMENT') {
    return 'awaiting_payment'
  }
  return mapStatementStatusToLineStatus(statementStatus)
}

/** API paymentStatus → 계좌 지급 UI 상태 */
export function mapPaymentStatusToAccountPaymentStatus(
  status: string | null | undefined
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

/**
 * 일괄 확인 CTA/체크박스 — BE `availableActions` 우선.
 * - actions 배열이 있으면 `CONFIRM_PAYMENT_STATEMENT` 포함 여부만 본다.
 * - statementStatus만 있으면 confirmable 상태 폴백.
 * - mock(축 없음)은 `pending`/`reapplication`만 허용.
 */
export function canConfirmPaymentStatement(row: {
  availableActions?: string[] | null
  statementStatus?: string | null
  canConfirmPaymentStatement?: boolean
  processingStatus?: PaymentOrderAdminLineProcessingStatus
}): boolean {
  if (typeof row.canConfirmPaymentStatement === 'boolean') {
    return row.canConfirmPaymentStatement
  }
  if (Array.isArray(row.availableActions)) {
    return row.availableActions.includes(CONFIRM_PAYMENT_STATEMENT_ACTION)
  }
  if (row.statementStatus != null && row.statementStatus !== '') {
    return isConfirmableStatementStatus(row.statementStatus)
  }
  return row.processingStatus === 'pending' || row.processingStatus === 'reapplication'
}
