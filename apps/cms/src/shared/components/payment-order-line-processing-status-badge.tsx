/**
 * 지급 조서 처리 현황(라인) 배지 — 신청자 목록「프로그램 승인 현황」과 동일 TextbookStatusBadge(app-status-badge) 계열
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import { TextbookStatusBadge } from './textbook-status-badge'

export type { PaymentOrderAdminLineProcessingStatus }

interface PaymentOrderLineProcessingStatusBadgeProps {
  status: PaymentOrderAdminLineProcessingStatus
  className?: string
}

export function PaymentOrderLineProcessingStatusBadge({
  status,
  className,
}: PaymentOrderLineProcessingStatusBadgeProps) {
  return (
    <TextbookStatusBadge variant="payment-order-line" status={status} className={className} />
  )
}
