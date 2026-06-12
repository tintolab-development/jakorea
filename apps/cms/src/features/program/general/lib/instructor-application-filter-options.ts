/** 일반 프로그램 — 강사 신청 목록 JA 강의 경력 필터 구간 value */
export type InstructorJaExperienceFilterValue =
  | 'all'
  | 'lt1'
  | '1-5'
  | '6-10'
  | '11-15'
  | '16-20'
  | '20+'

export const INSTRUCTOR_JA_EXPERIENCE_FILTER_OPTIONS: {
  label: string
  value: InstructorJaExperienceFilterValue
}[] = [
  { label: '전체', value: 'all' },
  { label: '1년 미만', value: 'lt1' },
  { label: '1~5년', value: '1-5' },
  { label: '6~10년', value: '6-10' },
  { label: '11~15년', value: '11-15' },
  { label: '16~20년', value: '16-20' },
  { label: '20년 이상', value: '20+' },
]

export const INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: 'A등급', value: 'A' },
  { label: 'B등급', value: 'B' },
  { label: 'C등급', value: 'C' },
  { label: 'D등급', value: 'D' },
] as const

/** lectureExperienceYears(숫자) ↔ JA 강의 경력 필터 구간 매칭 */
export function matchesInstructorJaExperienceYears(
  rowYears: number,
  filter: unknown
): boolean {
  const raw = String(filter ?? 'all')
  if (raw === 'all' || raw === '') return true

  switch (raw as InstructorJaExperienceFilterValue) {
    case 'lt1':
      return rowYears < 1
    case '1-5':
      return rowYears >= 1 && rowYears <= 5
    case '6-10':
      return rowYears >= 6 && rowYears <= 10
    case '11-15':
      return rowYears >= 11 && rowYears <= 15
    case '16-20':
      return rowYears >= 16 && rowYears <= 20
    case '20+':
      return rowYears >= 20
    default:
      return true
  }
}
