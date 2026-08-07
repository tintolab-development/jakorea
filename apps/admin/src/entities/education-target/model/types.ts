/**
 * 교재 소개 · 교육 대상 도메인
 * 관리 항목은 고정 5종 — 개수·인덱스 색상 변경 불가
 */

export type EducationTargetKey =
  | 'preschool'
  | 'elementary'
  | 'middle'
  | 'high'
  | 'adult'

export type EducationTarget = {
  id: string
  key: EducationTargetKey
  /** 1-based 고정 순번 (색상 인덱스) */
  sortOrder: number
  name: string
  /** 고정 hex (#RRGGBB) — UI에서 변경 불가 */
  indexColor: string
  updatedAt: string
}

export type EducationTargetNamePatch = {
  id: string
  name: string
}

/** No. 1→5 고정 인덱스 색상 */
export const EDUCATION_TARGET_INDEX_COLORS = [
  '#F6E846',
  '#A1BC2C',
  '#46B17B',
  '#0CBDCC',
  '#6D84DF',
] as const
