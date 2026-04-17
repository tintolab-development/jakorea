/**
 * 실적 관리 > 합계 탭 컬럼 · 카테고리 · 서브 행 메타
 * - 카테고리별 서브 행 구성은 서로 다름:
 *   경제금융 / 진로취업 / 기업가정신 → 초/중/고/성인/합계
 *   디지털리터러시 → 고/대학교/성인/합계
 */

import type {
  SummaryCategoryKey,
  SummaryColumnKey,
  SummarySubRowKey,
} from './education-record-types'

export type SummaryColumnMeta = {
  key: SummaryColumnKey
  /** 제목 앞머리(개수 / 합계) */
  kind: '개수' | '합계'
  /** 뒤 라벨 (학교명 / 학급수 / 총 참가자 ...) */
  label: string
}

/** 합계 미니 테이블 9열 정의 — `SummaryRow` 키 순서와 동일 */
export const SUMMARY_COLUMNS: readonly SummaryColumnMeta[] = [
  { key: 'schoolCount', kind: '개수', label: '학교명' },
  { key: 'classCount', kind: '개수', label: '학급수' },
  { key: 'participants', kind: '합계', label: '총 참가자' },
  { key: 'educationHours', kind: '합계', label: '교육시간' },
  { key: 'generalVolunteers', kind: '합계', label: '일반자원봉사자' },
  { key: 'staffVolunteers', kind: '합계', label: '임직원자원봉사자' },
  { key: 'generalTeachers', kind: '합계', label: '일반담당교사' },
  { key: 'educatedTeachers', kind: '합계', label: '교육받은교사' },
  { key: 'instructors', kind: '합계', label: '강사' },
] as const

/** 서브 행 라벨 맵 */
export const SUB_ROW_LABELS: Record<SummarySubRowKey, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
  adult: '성인',
  total: '합계',
}

export type SummaryCategoryMeta = {
  key: SummaryCategoryKey
  label: string
  /** 렌더 순서대로. 마지막은 항상 `'total'` (mint 강조 행) */
  subRows: readonly SummarySubRowKey[]
}

/** 카테고리 4종 메타 */
export const SUMMARY_CATEGORIES: readonly SummaryCategoryMeta[] = [
  {
    key: 'economyFinance',
    label: '경제금융',
    subRows: ['elementary', 'middle', 'high', 'adult', 'total'],
  },
  {
    key: 'careerEmployment',
    label: '진로취업',
    subRows: ['elementary', 'middle', 'high', 'adult', 'total'],
  },
  {
    key: 'entrepreneurship',
    label: '기업가정신',
    subRows: ['elementary', 'middle', 'high', 'adult', 'total'],
  },
  {
    key: 'digitalLiteracy',
    label: '디지털리터러시',
    subRows: ['high', 'university', 'adult', 'total'],
  },
] as const
