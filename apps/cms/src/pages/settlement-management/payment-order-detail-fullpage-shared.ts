/**
 * 지급 현황 상세 풀페이지 — 프로그램/강사 공통 포맷·필터 옵션·집계
 */

import dayjs, { type Dayjs } from 'dayjs'
import {
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  type PaymentOrderAdminLineProcessingStatus,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'

export const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

export const LINE_STATUS_OPTIONS: readonly PaymentOrderAdminLineProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'rejected',
]

export type AppliedLineStatus = 'all' | PaymentOrderAdminLineProcessingStatus

export const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-08-01'), dayjs('2026-06-30')]

/** 목록(지급조서 확인)에 조회 적용된 기간 → 상세 모달 기간 필터 초기값 */
export function resolveDetailInitialDateRange(
  listPageRange: [Dayjs, Dayjs] | null | undefined
): [Dayjs, Dayjs] | null {
  const a = listPageRange?.[0]
  const b = listPageRange?.[1]
  if (a && b && a.isValid() && b.isValid()) return [a, b]
  return null
}

export const lineStatusSelectOptions: { value: AppliedLineStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  ...(
    Object.keys(PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS) as PaymentOrderAdminLineProcessingStatus[]
  ).map(key => ({
    value: key,
    label: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[key],
  })),
]

export function formatKoreanDateWithWeekday(iso: string): string {
  const x = dayjs(iso)
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]})`
}

export function matchesDateRange(iso: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range?.[1]) return true
  const d = dayjs(iso)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

/**
 * 라인 상태로 기본정보의 지급조서 처리 현황(집계) 산출 — 사용자 수동 변경 없음.
 * `application_rejected`는 라인 enum 미포함 시 산출되지 않음(상수·스타일만 예약).
 */
export function deriveAggregateFromLines(
  statuses: PaymentOrderAdminLineProcessingStatus[]
): PaymentOrderDetailAggregateStatus {
  if (statuses.length === 0) return 'na'
  if (statuses.some(s => s === 'correction')) return 'correction'
  const hasConfirmed = statuses.some(s => s === 'confirmed')
  if (hasConfirmed && !statuses.every(s => s === 'confirmed')) return 'partial'
  if (statuses.every(s => s === 'confirmed')) return 'confirmed'
  if (statuses.every(s => s === 'rejected')) return 'rejected'
  if (statuses.every(s => s === 'pending')) return 'pending'
  /* confirmed 없이 pending·rejected 등만 혼재 */
  return 'pending'
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

/** 산출 내역서에서 확인 처리·신청 반려 후 목록 테이블 행과 동기화 */
export interface PaymentOrderCalculationStatementCommitPayload {
  lineId: string
  status: PaymentOrderAdminLineProcessingStatus
  rejectionReason?: string
}
