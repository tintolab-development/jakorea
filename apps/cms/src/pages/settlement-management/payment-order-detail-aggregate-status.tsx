/**
 * 지급조서 처리 현황 집계 문구 (기본정보 등)
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import {
  PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS,
  PAYMENT_ORDER_LINE_STATUS_LABELS_FULL,
  paymentOrderDetailAggregateStatusCssModifier,
  type PaymentOrderDetailAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'

export function renderAggregateStatus(status: PaymentOrderDetailAggregateStatus) {
  const mod = paymentOrderDetailAggregateStatusCssModifier(status)
  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--aggregate payment-order-admin__status-text--${mod}`}
    >
      {PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS[status]}
    </span>
  )
}

/** 풀페이지 하위 목록 테이블 — 라인별 처리 현황(태그 없이 문구+색) */
export function renderLineProcessingStatusText(status: PaymentOrderAdminLineProcessingStatus) {
  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--line payment-order-admin__status-text--${status}`}
    >
      {PAYMENT_ORDER_LINE_STATUS_LABELS_FULL[status]}
    </span>
  )
}
