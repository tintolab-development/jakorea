/** 기관 신청 양식 — 학급 수 선택 상한(모집 양식 미설정 시 기본) */
export const DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT = 40

export function buildInstitutionClassCountOptions(maxCount?: number | null) {
  const cap =
    maxCount != null && maxCount > 0
      ? Math.min(maxCount, DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT)
      : DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT
  return Array.from({ length: cap }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))
}

export function parsePositiveIntInput(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const n = parseInt(raw, 10)
  return Number.isNaN(n) || n < 0 ? undefined : n
}

const DEFAULT_MAX_SESSIONS_PER_DAY = 16

/** 신청 폼 — 1일(1일정)당 선택 가능 차시 옵션 */
export function buildInstitutionSessionCountOptions(maxSessionsPerDay?: number | null) {
  const cap =
    maxSessionsPerDay != null && maxSessionsPerDay > 0
      ? Math.min(maxSessionsPerDay, DEFAULT_MAX_SESSIONS_PER_DAY)
      : DEFAULT_MAX_SESSIONS_PER_DAY
  return Array.from({ length: cap }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}차시`,
  }))
}

export function clampInstitutionScheduleBlockCount(maxScheduleCount?: number | null): number {
  if (maxScheduleCount == null || maxScheduleCount < 1) return 1
  return Math.min(maxScheduleCount, 10)
}
