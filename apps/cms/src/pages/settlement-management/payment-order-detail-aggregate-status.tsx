/**
 * 지급조서 처리 현황 집계 문구 (기본정보 등)
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS,
  PAYMENT_ORDER_DETAIL_AGGREGATE_TEXT_COLOR,
  PAYMENT_ORDER_LINE_STATUS_LABELS_FULL,
  type PaymentOrderDetailAggregateStatus,
} from '@/shared/constants/payment-order-aggregate-status'
import { PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR } from '@/shared/constants/payment-order-status-list-colors'
import { StatusBadge } from '@/shared/components/status-badge'

export function renderAggregateStatus(status: PaymentOrderDetailAggregateStatus) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="payment-order-admin__status-text payment-order-admin__status-text--aggregate"
      label={PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS[status]}
      accentColor={PAYMENT_ORDER_DETAIL_AGGREGATE_TEXT_COLOR[status]}
    />
  )
}

/** 풀페이지 하위 목록 테이블 — 라인별 처리 현황(태그 없이 문구+색) */
export function renderLineProcessingStatusText(status: PaymentOrderAdminLineProcessingStatus) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="payment-order-admin__status-text payment-order-admin__status-text--line"
      label={PAYMENT_ORDER_LINE_STATUS_LABELS_FULL[status]}
      accentColor={PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[status]}
    />
  )
}
