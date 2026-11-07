import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export type SettlementNotificationResendKind =
  | 'confirmed'
  | 'paid'
  | 'rejected'
  | 'correction_completed'

export function resolveSettlementNotificationResendKind(
  status: PaymentOrderAdminLineProcessingStatus
): SettlementNotificationResendKind | null {
  if (status === 'confirmed' || status === 'awaiting_payment') return 'confirmed'
  if (status === 'rejected') return 'paid'
  if (status === 'application_rejected') return 'rejected'
  if (status === 'reapplication') return 'correction_completed'
  return null
}

export function canResendSettlementCalculationStatementNotification(
  status: PaymentOrderAdminLineProcessingStatus,
  availableActions?: readonly string[] | null
): boolean {
  if (resolveSettlementNotificationResendKind(status) == null) return false
  return availableActions?.includes('RESEND_NOTIFICATION') === true
}

export function resolveInstructorInvoiceNotificationResendKind(
  status: InstructorSettlementUiStatus
): SettlementNotificationResendKind | null {
  if (status === 'payment_statement_verified') return 'confirmed'
  if (status === 'account_paid') return 'paid'
  if (status === 'application_rejected') return 'rejected'
  if (status === 'payment_statement_reapplication') return 'correction_completed'
  return null
}

export function canResendInstructorInvoiceNotification(
  status: InstructorSettlementUiStatus,
  availableActions?: readonly string[] | null
): boolean {
  if (resolveInstructorInvoiceNotificationResendKind(status) == null) return false
  return availableActions?.includes('RESEND_NOTIFICATION') === true
}

export function buildSettlementNotificationResendMessage(
  kind: SettlementNotificationResendKind
): string {
  if (kind === 'rejected') {
    return '강사비 신청 반려 알림을 재발송하시겠습니까?\n확인 시 반려 사유와 함께 알림이 재발송됩니다.'
  }
  if (kind === 'paid') {
    return '강사비 계좌 지급 완료 알림을 재발송하시겠습니까?\n확인 시 강사에게 지급 완료 알림이 재발송됩니다.'
  }
  if (kind === 'correction_completed') {
    return '강사비 지급 정정 완료 알림을 재발송하시겠습니까?\n확인 시 강사에게 정정 완료 알림이 재발송됩니다.'
  }
  return '강사비 신청 확인 완료 알림을 재발송하시겠습니까?\n확인 시 강사에게 확인 완료 알림이 재발송됩니다.'
}
