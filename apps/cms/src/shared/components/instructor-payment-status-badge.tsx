/**
 * 강사 상세 > 정산 현황 상태 배지
 */

import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import './instructor-payment-status-badge.css'

const STATUS_TO_MODIFIER: Record<InstructorSettlementUiStatus, string> = {
  payment_statement_verified: 'payment-statement-verified',
  application_rejected: 'application-rejected',
  awaiting_confirmation: 'awaiting-confirmation',
  payment_correction_requested: 'payment-correction-requested',
  account_paid: 'account-paid',
  none: 'none',
}

export interface InstructorPaymentStatusBadgeProps {
  status: InstructorSettlementUiStatus
  className?: string
}

export function InstructorPaymentStatusBadge({ status, className }: InstructorPaymentStatusBadgeProps) {
  const modifier = STATUS_TO_MODIFIER[status]
  const label = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]
  return (
    <span
      className={`instructor-payment-status-badge instructor-payment-status-badge--${modifier} ${className ?? ''}`.trim()}
    >
      {label}
    </span>
  )
}
