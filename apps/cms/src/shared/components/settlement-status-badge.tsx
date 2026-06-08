/**
 * 정산 현황 배지 — `InstructorPaymentStatusBadge` 위임 (8종 공통)
 */

import { InstructorPaymentStatusBadge } from './instructor-payment-status-badge'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

/** @deprecated `InstructorSettlementUiStatus` 사용 */
export type SettlementStatusKey = InstructorSettlementUiStatus

interface SettlementStatusBadgeProps {
  status: InstructorSettlementUiStatus
  className?: string
}

export function SettlementStatusBadge({ status, className }: SettlementStatusBadgeProps) {
  return <InstructorPaymentStatusBadge status={status} className={className} />
}
