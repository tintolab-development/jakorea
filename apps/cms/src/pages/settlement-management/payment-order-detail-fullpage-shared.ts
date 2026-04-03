/**
 * 지급 현황 상세 풀페이지 — 프로그램/강사 공통 포맷·필터 옵션·집계
 */

import dayjs, { type Dayjs } from 'dayjs'
import {
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  type PaymentOrderAdminLineProcessingStatus,
  type PaymentOrderAdminProcessingStatus,
} from '@/data/mock/payment-order-admin-list'

export const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

export const LINE_STATUS_OPTIONS: readonly PaymentOrderAdminLineProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'rejected',
]

export type AppliedLineStatus = 'all' | PaymentOrderAdminLineProcessingStatus

export const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-08-01'), dayjs('2026-06-30')]

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

export function formatLectureCell(iso: string, sessionOrdinal: number): string {
  return `${formatKoreanDateWithWeekday(iso)} | ${sessionOrdinal}차시`
}

export function matchesDateRange(iso: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range?.[1]) return true
  const d = dayjs(iso)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

/** 라인 상태로 기본정보의 지급조서 처리 현황(집계) 유도 — 일부 확인 완료 없음, 혼재 시 제출 및 대기 */
export function deriveAggregateFromLines(
  statuses: PaymentOrderAdminLineProcessingStatus[]
): PaymentOrderAdminProcessingStatus {
  if (statuses.length === 0) return 'pending'
  if (statuses.some(s => s === 'correction')) return 'correction'
  if (statuses.every(s => s === 'confirmed')) return 'confirmed'
  if (statuses.every(s => s === 'rejected')) return 'rejected'
  if (statuses.every(s => s === 'pending')) return 'pending'
  return 'pending'
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}
