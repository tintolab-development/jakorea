/**
 * CMS/Portal instructor profile response codes.
 *
 * API response types intentionally remain string-based for forward compatibility.
 * These constants are used only when mapping wire values to Platform display labels.
 */
export const INSTRUCTOR_FEE_GRADE_CODES = {
  GRADE_1: 'GRADE_1',
  GRADE_2: 'GRADE_2',
  GRADE_3: 'GRADE_3',
} as const

export const INSTRUCTOR_JA_GRADE_CODES = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const

const INSTRUCTOR_FEE_GRADE_LABELS: Record<string, string> = {
  [INSTRUCTOR_FEE_GRADE_CODES.GRADE_1]: '1급 강사비',
  [INSTRUCTOR_FEE_GRADE_CODES.GRADE_2]: '2급 강사비',
  [INSTRUCTOR_FEE_GRADE_CODES.GRADE_3]: '3급 강사비',
}

const INSTRUCTOR_JA_GRADE_LABELS: Record<string, string> = {
  [INSTRUCTOR_JA_GRADE_CODES.A]: 'A등급',
  [INSTRUCTOR_JA_GRADE_CODES.B]: 'B등급',
  [INSTRUCTOR_JA_GRADE_CODES.C]: 'C등급',
  [INSTRUCTOR_JA_GRADE_CODES.D]: 'D등급',
}

function normalized(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

/** API 코드와 이미 변환된 라벨을 모두 받아 표시 라벨만 반환한다. */
export function mapInstructorFeeGradeLabel(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return INSTRUCTOR_FEE_GRADE_LABELS[normalized(trimmed)] ?? trimmed
}

/** API 코드와 이미 변환된 라벨을 모두 받아 표시 라벨만 반환한다. */
export function mapInstructorJaGradeLabel(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return INSTRUCTOR_JA_GRADE_LABELS[normalized(trimmed)] ?? trimmed
}
