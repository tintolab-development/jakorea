/** 학년 범위를 아는 학교급 (기획 2026-11-14) */
export type SchoolLevel = '초등학교' | '중학교' | '고등학교' | '대학교' | '전문대학'

const MAX_GRADE_BY_SCHOOL_LEVEL: Record<SchoolLevel, number> = {
  초등학교: 6,
  중학교: 3,
  고등학교: 3,
  대학교: 6,
  전문대학: 6,
}

/** 알 수 있는 학교급이면 그대로, 아니면(특수·각종학교, 미선택 등) undefined */
export function toSchoolLevel(value: string | null | undefined): SchoolLevel | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return Object.prototype.hasOwnProperty.call(MAX_GRADE_BY_SCHOOL_LEVEL, trimmed)
    ? (trimmed as SchoolLevel)
    : undefined
}

/**
 * 학교급에 맞는 학년 옵션 — `allOptions`(1학년부터 순서대로)의 앞에서부터 학교급 최대 학년까지.
 * 학교급을 모르면 `allOptions` 그대로.
 */
export function getSchoolGradeOptions<T extends string>(
  schoolLevel: string | null | undefined,
  allOptions: readonly T[],
): readonly T[] {
  const level = toSchoolLevel(schoolLevel)
  if (!level) return allOptions
  return allOptions.slice(0, MAX_GRADE_BY_SCHOOL_LEVEL[level])
}

/** 고른 학년이 학교급의 학년 범위 안인지 (학년 미선택이면 true) */
export function isGradeInSchoolLevel(
  grade: string,
  schoolLevel: string | null | undefined,
  allOptions: readonly string[],
): boolean {
  if (!grade.trim()) return true
  return getSchoolGradeOptions(schoolLevel, allOptions).includes(grade)
}
