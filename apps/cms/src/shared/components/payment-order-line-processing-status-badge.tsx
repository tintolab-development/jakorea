/**
 * 지급 조서 처리 현황(라인) 태그 — 공통 `StatusTag` (`getPaymentOrderLineStatusTag`)
 * 색상: `payment-order-status-list-colors` 목록 글자색을 accentColor로 사용
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import { getPaymentOrderLineStatusTag } from '@/shared/lib/status-tag-specs'
import { StatusTag } from './status-tag'

export type { PaymentOrderAdminLineProcessingStatus }

interface PaymentOrderLineProcessingStatusBadgeProps {
  status: PaymentOrderAdminLineProcessingStatus
}

export function PaymentOrderLineProcessingStatusBadge({
  status,
}: PaymentOrderLineProcessingStatusBadgeProps) {
  return <StatusTag {...getPaymentOrderLineStatusTag(status)} />
}
