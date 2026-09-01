/** 강사 회원 목록 — 정산 현황 필터 (`listMetrics.settlementStatusLabel` 과 동일 라벨) */
import { INSTRUCTOR_SETTLEMENT_STATUS_LABELS, INSTRUCTOR_SETTLEMENT_STATUS_ORDER } from '@/shared/constants/instructor-settlement-status'

/** 강사 회원 목록 — JA 평가 등급 필터 (`listMetrics.jaEvaluationGrade` A|B|C|D) */
export const INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  { label: 'A등급', value: 'A' },
  { label: 'B등급', value: 'B' },
  { label: 'C등급', value: 'C' },
  { label: 'D등급', value: 'D' },
]

export const INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  ...INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map(status => ({
    label: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status],
    value: INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status],
  })),
]
