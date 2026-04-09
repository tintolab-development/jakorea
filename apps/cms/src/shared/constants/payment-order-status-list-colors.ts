/**
 * 지급조서 처리 현황 색상
 * - LIST: 목록·캘린더·라인 배지(`payment-order-line`) 등
 * - DETAIL: 상세 라벨 배지(`payment-order-line-detail`) — LIST와 동일, `rejected`만 중립 톤
 */

import type { PaymentOrderAdminProcessingStatus } from '@/data/mock/payment-order-admin-list'

/** 본문·라벨 텍스트 */
export const PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  pending: '#1E8C29',
  confirmed: '#017EAF',
  correction: '#C32F4A',
  rejected: '#8457CE',
}

/** 면 배경 */
export const PAYMENT_ORDER_STATUS_LIST_BG: Record<PaymentOrderAdminProcessingStatus, string> = {
  pending: 'rgba(30, 140, 41, 0.06)',
  confirmed: 'rgba(1, 161, 175, 0.06)',
  correction: 'rgba(195, 47, 74, 0.06)',
  rejected: 'rgba(132, 87, 206, 0.06)',
}

/** 테두리(1px solid 용) */
export const PAYMENT_ORDER_STATUS_LIST_BORDER: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  pending: 'rgba(30, 140, 41, 0.10)',
  confirmed: 'rgba(1, 161, 175, 0.10)',
  correction: 'rgba(195, 47, 74, 0.10)',
  rejected: 'rgba(132, 87, 206, 0.10)',
}

/** 상세(DETAIL) — LIST와 동일, rejected만 회색 톤 */
export const PAYMENT_ORDER_STATUS_DETAIL_TEXT_COLOR: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  ...PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR,
  rejected: '#464646',
}

export const PAYMENT_ORDER_STATUS_DETAIL_BG: Record<PaymentOrderAdminProcessingStatus, string> = {
  ...PAYMENT_ORDER_STATUS_LIST_BG,
  rejected: '#F2F3F5',
}

export const PAYMENT_ORDER_STATUS_DETAIL_BORDER: Record<
  PaymentOrderAdminProcessingStatus,
  string
> = {
  ...PAYMENT_ORDER_STATUS_LIST_BORDER,
  rejected: 'rgba(70, 70, 70, 0.06)',
}
