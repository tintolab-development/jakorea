/**
 * 지급 조서 처리 현황(라인) 배지 — TextbookStatusBadge `payment-order-line`
 * 색상: theme-provider.css `--color-payment-order-line-*` · TS `paymentOrderLineStatusColors`
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
