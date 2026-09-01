/**
 * 강사 상세 > 정산 현황 상태 배지 — `status-badge.css` instructor-settlement-* 와 동일 색
 */

import {
  INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import '@/shared/components/status-badge.css'
import './instructor-payment-status-badge.css'

export interface InstructorPaymentStatusBadgeProps {
  status: InstructorSettlementUiStatus
  className?: string
}

export function InstructorPaymentStatusBadge({
  status,
  className,
}: InstructorPaymentStatusBadgeProps) {
  const mod = INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS[status]
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
