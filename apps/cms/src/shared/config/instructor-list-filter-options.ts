/** 강사 회원 목록 — 강사 유형 필터 (표시 라벨과 값 동일) */
export const INSTRUCTOR_TYPE_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  { label: 'JA 강사단', value: 'JA 강사단' },
  { label: '특강 강사', value: '특강 강사' },
  { label: '제미나이', value: '제미나이' },
]

/** 강사 회원 목록 — 정산 현황 필터 (`listMetrics.settlementStatusLabel` 과 동일 라벨) */
import { INSTRUCTOR_SETTLEMENT_STATUS_LABELS, INSTRUCTOR_SETTLEMENT_STATUS_ORDER } from '@/shared/constants/instructor-settlement-status'

export const INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  ...INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map(status => ({
    label: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status],
    value: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status],
  })),
]
