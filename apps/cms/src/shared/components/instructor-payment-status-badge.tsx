/**
 * 강사 상세 > 정산 현황 상태 배지 — `status-badge.css` instructor-settlement-* 와 동일 색
 */

import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import '@/shared/components/status-badge.css'
import './instructor-payment-status-badge.css'

const STATUS_TO_STATUS_BADGE_CLASS: Record<InstructorSettlementUiStatus, string> = {
  awaiting_confirmation: 'status-badge--instructor-settlement-awaiting',
  partial_confirmation: 'status-badge--instructor-settlement-partial',
  payment_statement_verified: 'status-badge--instructor-settlement-statement-verified',
  account_paid: 'status-badge--instructor-settlement-account-paid',
  none: 'status-badge--instructor-settlement-na',
  application_rejected: 'status-badge--instructor-settlement-rejected',
  payment_correction_requested: 'status-badge--instructor-settlement-correction',
}

export interface InstructorPaymentStatusBadgeProps {
  status: InstructorSettlementUiStatus
  className?: string
}

export function InstructorPaymentStatusBadge({
  status,
  className,
}: InstructorPaymentStatusBadgeProps) {
  const mod = STATUS_TO_STATUS_BADGE_CLASS[status]
  const label = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]
  return (
    <span
      role="status"
      className={`status-badge status-badge--variant-badge ${mod} instructor-payment-status-badge ${className ?? ''}`.trim()}
    >
      {label}
    </span>
  )
}
