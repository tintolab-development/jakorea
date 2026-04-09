/**
 * 지급조서 처리 현황 집계 문구 (기본정보 등)
 */

import { PAYMENT_ORDER_STATUS_LABELS_LIST } from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderAdminProcessingStatus } from '@/data/mock/payment-order-admin-list'

export function renderAggregateStatus(status: PaymentOrderAdminProcessingStatus) {
  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${status}`}
    >
      {PAYMENT_ORDER_STATUS_LABELS_LIST[status]}
    </span>
  )
}
