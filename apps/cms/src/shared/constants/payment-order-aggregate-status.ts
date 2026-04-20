/**
 * 지급 현황 상세 풀페이지 — 기본 정보 「지급 조서 처리 현황」 집계 전용
 * (목록/캘린더 `PaymentOrderAdminProcessingStatus` 와 분리)
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

/** 테이블·상세 목록 라인 — 전체 문구 (캘린더는 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 함축형만 사용) */
export const PAYMENT_ORDER_LINE_STATUS_LABELS_FULL: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '확인 대기 중',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
  rejected: '계좌 지급 완료',
}

export const PAYMENT_ORDER_DETAIL_AGGREGATE_STATUSES = [
  'pending',
  'partial',
  'confirmed',
  'rejected',
  'na',
  'correction',
  'application_rejected',
] as const

export type PaymentOrderDetailAggregateStatus =
  (typeof PAYMENT_ORDER_DETAIL_AGGREGATE_STATUSES)[number]

/** 집계 문구(기획 카피) */
export const PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS: Record<
  PaymentOrderDetailAggregateStatus,
  string
> = {
  pending: '확인 대기 중',
  partial: '일부 확인 완료',
  confirmed: '지급조서 확인 완료',
  rejected: '계좌 지급 완료',
  na: '해당 없음',
  correction: '지급 정정 요청',
  application_rejected: '신청 반려',
}

/**
 * 집계 텍스트 색 — `payment-order-admin-status-tag.css` 와 동일 토큰·fallback
 * (인라인 스타일·차트 등에서 재사용 시)
 */
export const PAYMENT_ORDER_DETAIL_AGGREGATE_TEXT_COLOR: Record<
  PaymentOrderDetailAggregateStatus,
  string
> = {
  pending: 'var(--color-orange, #F07917)',
  partial: 'var(--color-purple, #8457CE)',
  confirmed: 'var(--color-green, #1E8C29)',
  rejected: 'var(--color-blue, #017EAF)',
  na: 'var(--main-BK, #3D3D3D)',
  correction: 'var(--color-red, #C32F4A)',
  application_rejected: 'var(--color-red, #C32F4A)',
}

/** CSS BEM modifier (`payment-order-admin__status-text--*`) */
export function paymentOrderDetailAggregateStatusCssModifier(
  status: PaymentOrderDetailAggregateStatus
): string {
  return status === 'application_rejected' ? 'application-rejected' : status
}
