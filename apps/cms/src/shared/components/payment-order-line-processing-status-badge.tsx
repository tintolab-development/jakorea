/**
 * 지급 조서 처리 현황(라인) 배지 — TextbookStatusBadge `payment-order-line`
 * 색상: theme-provider.css `--color-payment-order-line-*` · TS `paymentOrderLineStatusColors`
 */

import type { CSSProperties } from 'react'
import type { PaymentOrderAdminProcessingStatus } from '@/data/mock/payment-order-admin-list'
import { TextbookStatusBadge } from './textbook-status-badge'

export type { PaymentOrderAdminProcessingStatus }

interface PaymentOrderLineProcessingStatusBadgeProps {
  status: PaymentOrderAdminProcessingStatus
  className?: string
  style?: CSSProperties
  /** true면 `PAYMENT_ORDER_STATUS_LABELS_DETAIL`(상세), 기본은 라인용 문구 */
  detailLabels?: boolean
}

export function PaymentOrderLineProcessingStatusBadge({
  status,
  className,
  style,
  detailLabels = false,
}: PaymentOrderLineProcessingStatusBadgeProps) {
  return (
    <TextbookStatusBadge
      variant={detailLabels ? 'payment-order-line-detail' : 'payment-order-line'}
      status={status}
      className={className}
      style={style}
    />
  )
}
