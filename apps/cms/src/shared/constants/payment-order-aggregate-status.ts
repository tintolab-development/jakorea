/**
 * 지급 현황 상세 풀페이지 — 기본 정보 「지급 조서 처리 현황」 집계 전용
 * (목록/캘린더 `PaymentOrderAdminProcessingStatus` 와 분리)
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import { INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE } from '@/features/settlement-management/model/instructor-member-settlements'

/** 테이블·상세 목록 라인 — 전체 문구 (캘린더는 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 함축형만 사용) */
export const PAYMENT_ORDER_LINE_STATUS_LABELS_FULL: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  confirmed: '지급조서 확인 완료',
  awaiting_payment: '지급 대기',
  correction: '지급 정정 요청',
  rejected: '계좌 지급 완료',
  application_rejected: '신청 반려',
}

export const PAYMENT_ORDER_DETAIL_AGGREGATE_STATUSES = [
  'pending',
  'partial',
  'confirmed',
  'correction',
  'application_rejected',
  'na',
] as const

export type PaymentOrderDetailAggregateStatus =
  (typeof PAYMENT_ORDER_DETAIL_AGGREGATE_STATUSES)[number]

/** 집계 문구(기획 카피) */
export const PAYMENT_ORDER_DETAIL_AGGREGATE_LABELS: Record<
  PaymentOrderDetailAggregateStatus,
  string
> = {
  pending: '확인 대기 중',
  partial: '확인 진행 중',
  confirmed: '지급조서 확인 완료',
  correction: '지급 정정 요청',
  application_rejected: '신청 반려',
  na: '해당 없음',
}

/**
 * 집계 텍스트 색 정본 — 기본 정보 집계 Text(StatusBadge text)에서 사용
 */
export const PAYMENT_ORDER_DETAIL_AGGREGATE_TEXT_COLOR: Record<
  PaymentOrderDetailAggregateStatus,
  string
> = {
  pending: 'var(--color-orange, #F07917)',
  partial: 'var(--color-purple, #8457CE)',
  confirmed: 'var(--color-green, #1E8C29)',
  correction: INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE.payment_correction_requested.color,
  application_rejected: INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE.application_rejected.color,
  na: 'var(--main-BK, #3D3D3D)',
}

/** 계좌 지급 현황(rule): API·타입 호환용 4키 (목록 UI 필터는 LIST_FILTER 2종만) */
export const ACCOUNT_PAYMENT_AGGREGATE_STATUSES = [
  'awaiting_confirmation',
  'partial_confirmation',
  'account_paid',
  'payment_correction_requested',
] as const

export type AccountPaymentAggregateStatus = (typeof ACCOUNT_PAYMENT_AGGREGATE_STATUSES)[number]

/** 계좌 지급 확인 목록·필터 — Notion/시안 2종 */
export const ACCOUNT_PAYMENT_LIST_FILTER_STATUSES = [
  'awaiting_confirmation',
  'account_paid',
] as const

export type AccountPaymentListFilterStatus = (typeof ACCOUNT_PAYMENT_LIST_FILTER_STATUSES)[number]

export const ACCOUNT_PAYMENT_AGGREGATE_LABELS: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation: '계좌 지급 대기 중',
  partial_confirmation: '확인 진행 중',
  account_paid: '계좌 지급 완료',
  payment_correction_requested: '지급 정정 요청',
}

/** 계좌 지급 현황 Text 색 (Figma Status / Text / 계좌 지급 현황 665:26740 — 대기 중 녹 · 지급 완료 청). 일부·정정은 시안 없음, 기존 색 유지 */
export const ACCOUNT_PAYMENT_AGGREGATE_TEXT_COLOR: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation: 'var(--Status-green-main, #1e8c29)',
  partial_confirmation: 'var(--Status-purple-main, #8457ce)',
  account_paid: 'var(--Status-blue-main, #017eaf)',
  payment_correction_requested: 'var(--Status-pink-main, #e8007c)',
}

/** 캘린더 hover·우측 목록 숏 라벨 (시안: 지급 대기 / 지급 완료) */
export const ACCOUNT_PAYMENT_STATUS_SHORT_LABELS: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation: '지급 대기',
  partial_confirmation: '확인 중',
  account_paid: '지급 완료',
  payment_correction_requested: '정정 요청',
}
