/** 개인 회원 학교 재학 여부 API 값 → 표시 라벨 (회원 상세와 동일 문구) */
export const SCHOOL_ENROLLMENT_STATUS_LABELS = {
  ENROLLED: '재학 중',
  NOT_ENROLLED: '해당 없음',
} as const

/** `ENROLLED` | `NOT_ENROLLED` → 라벨, 알 수 없는 값은 원문 유지, 빈 값은 `undefined` */
export function toSchoolEnrollmentStatusLabelOrRaw(
  status: string | undefined | null
): string | undefined {
  const raw = status?.trim()
  if (!raw) return undefined
  const upper = raw.toUpperCase()
  if (upper === 'ENROLLED') return SCHOOL_ENROLLMENT_STATUS_LABELS.ENROLLED
  if (upper === 'NOT_ENROLLED') return SCHOOL_ENROLLMENT_STATUS_LABELS.NOT_ENROLLED
  return raw
}
