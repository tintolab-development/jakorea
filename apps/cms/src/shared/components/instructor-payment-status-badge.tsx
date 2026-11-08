/**
 * 강사 정산 현황 태그 — 공통 `StatusTag` (`getInstructorSettlementStatusTag`, 8종 accentColor)
 */

import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import { getInstructorSettlementStatusTag } from '@/shared/lib/status-tag-specs'
import { StatusTag } from './status-tag'

export interface InstructorPaymentStatusBadgeProps {
  status: InstructorSettlementUiStatus
}

export function InstructorPaymentStatusBadge({ status }: InstructorPaymentStatusBadgeProps) {
  return <StatusTag {...getInstructorSettlementStatusTag(status)} />
}
