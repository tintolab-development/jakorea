/**
 * 지급 현황 상세 풀페이지 — 기본 정보 「지급 조서 처리 현황」 집계 전용
 * (목록/캘린더 `PaymentOrderAdminProcessingStatus` 와 분리)
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'

/** 테이블·상세 목록 라인 — 전체 문구 (캘린더는 `PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST` 함축형만 사용) */
export const PAYMENT_ORDER_LINE_STATUS_LABELS_FULL: Record<
  PaymentOrderAdminLineProcessingStatus,
  string
> = {
  pending: '확인 대기 중',
  reapplication: '지급조서 재신청',
  confirmed: '지급조서 확인 완료',
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
  correction: INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE.payment_correction_requested.color,
  application_rejected: INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE.application_rejected.color,
  na: 'var(--main-BK, #3D3D3D)',
}

/** CSS BEM modifier (`payment-order-admin__status-text--*`) */
export function paymentOrderDetailAggregateStatusCssModifier(
  status: PaymentOrderDetailAggregateStatus
): string {
  return status === 'application_rejected' ? 'application-rejected' : status
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

export type AccountPaymentListFilterStatus =
  (typeof ACCOUNT_PAYMENT_LIST_FILTER_STATUSES)[number]

export const ACCOUNT_PAYMENT_AGGREGATE_LABELS: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation: '계좌 지급 대기 중',
  partial_confirmation: '확인 진행 중',
  account_paid: '계좌 지급 완료',
  payment_correction_requested: '지급 정정 요청',
}

/** 캘린더 hover·우측 목록 숏 라벨 (시안: 지급 대기 / 지급 완료) */
export const ACCOUNT_PAYMENT_STATUS_SHORT_LABELS: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation: '지급 대기',
  partial_confirmation: '확인 중',
  account_paid: '지급 완료',
  payment_correction_requested: '정정 요청',
}

const ACCOUNT_PAYMENT_TO_INSTRUCTOR_SETTLEMENT_STATUS: Record<
  AccountPaymentAggregateStatus,
  InstructorSettlementUiStatus
> = {
  awaiting_confirmation: 'awaiting_confirmation',
  partial_confirmation: 'partial_confirmation',
  account_paid: 'account_paid',
  payment_correction_requested: 'payment_correction_requested',
}

/** 색상은 강사 정산 현황(status tag) 톤을 재사용 */
export const ACCOUNT_PAYMENT_AGGREGATE_TEXT_COLOR: Record<AccountPaymentAggregateStatus, string> = {
  awaiting_confirmation:
    INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[
      ACCOUNT_PAYMENT_TO_INSTRUCTOR_SETTLEMENT_STATUS.awaiting_confirmation
    ].color,
  partial_confirmation:
    INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[
      ACCOUNT_PAYMENT_TO_INSTRUCTOR_SETTLEMENT_STATUS.partial_confirmation
    ].color,
  account_paid:
    INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[
      ACCOUNT_PAYMENT_TO_INSTRUCTOR_SETTLEMENT_STATUS.account_paid
    ].color,
  payment_correction_requested:
    INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[
      ACCOUNT_PAYMENT_TO_INSTRUCTOR_SETTLEMENT_STATUS.payment_correction_requested
    ].color,
}
