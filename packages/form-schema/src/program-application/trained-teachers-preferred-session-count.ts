/**
 * 교육받은 교사(TRAINED_TEACHER) 기관 신청 — 진행 희망 교육 일정 「희망 차시」 셀렉 상한.
 * CMS 신청 양식 미리보기와 Platform 신청 화면이 같은 규칙을 쓴다.
 *
 * - 모집 「신청 가능 1일 최대 차시」(maxSessionsPerDay)가 있으면 그 값(상한 16)
 * - 없으면 2차시 (1사1교 희망 차시 셀렉·OpenAPI `RequestedScheduleRequest.sessionCount` max 2와 같음)
 */

/** 모집 1일 최대 차시를 받지 못했을 때의 희망 차시 상한 */
export const TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX = 2

/** OpenAPI `PreferredScheduleBlockRequest.sessionTimes` maxItems */
export const TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_HARD_MAX = 16

export function resolveTrainedTeachersPreferredSessionCountMax(
  maxSessionsPerDay?: number | null
): number {
  return typeof maxSessionsPerDay === 'number' &&
    Number.isInteger(maxSessionsPerDay) &&
    maxSessionsPerDay > 0
    ? Math.min(maxSessionsPerDay, TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_HARD_MAX)
    : TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX
}

/** 희망 차시 셀렉 선택지 `1차시` … `N차시` */
export function buildTrainedTeachersPreferredSessionCountOptions(
  maxSessionsPerDay?: number | null
): { value: string; label: string }[] {
  const max = resolveTrainedTeachersPreferredSessionCountMax(maxSessionsPerDay)
  return Array.from({ length: max }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}차시`,
  }))
}
