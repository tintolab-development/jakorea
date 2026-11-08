/**
 * 지급조서 처리 현황 색상
 * - LIST: 목록·캘린더·라인 배지(`payment-order-line`) 등
 * - DETAIL: 상세 라벨 배지(`payment-order-line-detail`) — LIST와 동일, `rejected`만 중립 톤
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'

/** 본문·라벨 텍스트 */
export const PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '#F07917',
  reapplication: '#F07917',
  confirmed: '#1E8C29',
  awaiting_payment: '#F07917',
  correction: '#E8007C',
  rejected: '#017EAF',
  application_rejected: '#C32F4A',
}

/** 면 배경 */
export const PAYMENT_ORDER_STATUS_LIST_BG: Record<PaymentOrderAdminLineProcessingStatus, string> = {
  pending: 'rgba(240, 121, 23, 0.06)',
  reapplication: 'rgba(240, 121, 23, 0.06)',
  confirmed: '#F2F8F2',
  awaiting_payment: 'rgba(240, 121, 23, 0.06)',
  correction: 'rgba(195, 47, 74, 0.06)',
  rejected: 'linear-gradient(0deg, rgba(1, 126, 175, 0.10) 0%, rgba(1, 126, 175, 0.10) 100%), #FFF',
  application_rejected: 'rgba(195, 47, 74, 0.06)',
}

/** 테두리(1px solid 용) */
export const PAYMENT_ORDER_STATUS_LIST_BORDER: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: 'rgba(240, 121, 23, 0.10)',
  reapplication: 'rgba(240, 121, 23, 0.10)',
  confirmed: 'rgba(30, 140, 41, 0.10)',
  awaiting_payment: 'rgba(240, 121, 23, 0.10)',
  correction: 'rgba(195, 47, 74, 0.10)',
  rejected: 'rgba(1, 126, 175, 0.10)',
  application_rejected: 'rgba(195, 47, 74, 0.10)',
}

/** 상세(DETAIL) — LIST와 동일, rejected만 회색 톤 */
export const PAYMENT_ORDER_STATUS_DETAIL_TEXT_COLOR: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  ...PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR,
}

export const PAYMENT_ORDER_STATUS_DETAIL_BG: Record<PaymentOrderAdminLineProcessingStatus, string> =
  {
    ...PAYMENT_ORDER_STATUS_LIST_BG,
  }

export const PAYMENT_ORDER_STATUS_DETAIL_BORDER: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  ...PAYMENT_ORDER_STATUS_LIST_BORDER,
}
