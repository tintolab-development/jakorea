import type { SurveySubmissionPeriod } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'

const SEOUL_TIME_ZONE = 'Asia/Seoul'

export function seoulCalendarYmd(value: string | number | Date): string | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-CA', { timeZone: SEOUL_TIME_ZONE })
}

export function isSameSeoulCalendarDay(iso: string, now = new Date()): boolean {
  const left = seoulCalendarYmd(iso)
  const right = seoulCalendarYmd(now)
  return left != null && left === right
}

/** Asia/Seoul 다음 달력일 00:00 — 등록 직후 BEFORE_START를 열 때 사용 */
export function seoulStartOfNextCalendarDayIso(now = new Date()): string {
  const ymd = seoulCalendarYmd(now)
  if (ymd == null) {
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return `${seoulCalendarYmd(next) ?? ''}T00:00:00.000+09:00`
  }
  const [year, month, day] = ymd.split('-').map(Number)
  const nextYmd = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
  return `${nextYmd}T00:00:00.000+09:00`
}

function seoulStartOfCalendarDayIso(ymd: string): string {
  return `${ymd}T00:00:00.000+09:00`
}

function seoulEndOfCalendarDayIso(ymd: string): string {
  return `${ymd}T23:59:59.999+09:00`
}

export function seoulStartOfTodayIso(now = new Date()): string {
  const ymd = seoulCalendarYmd(now)
  if (ymd == null) return new Date(now.getTime() - 1000).toISOString()
  return seoulStartOfCalendarDayIso(ymd)
}

/** SURVEY는 종료 시각이 필수 — 「마감 없음」은 이 열린 종료일로 저장한다. */
export const SURVEY_OPEN_ENDED_END_AT = '2099-12-31T14:59:59.999Z'

/**
 * SURVEY 바인딩 생성은 시작·종료를 모두 요구한다.
 * 양식 위저드 전에 날짜가 없으면 Asia/Seoul 다음 날로 채워 BEFORE_START로 연다.
 * 템플릿에 custom 기간이 있으면 그대로 둔다.
 */
export function ensureSurveyCreateSubmissionPeriod(
  period: SurveySubmissionPeriod,
  now = new Date()
): { submissionStartAt: string; submissionEndAt: string } {
  const start = period.submissionStartAt?.trim()
  const end = period.submissionEndAt?.trim()
  if (start && end) return { submissionStartAt: start, submissionEndAt: end }

  const submissionStartAt = start || seoulStartOfNextCalendarDayIso(now)
  if (end) return { submissionStartAt, submissionEndAt: end }

  const startYmd = seoulCalendarYmd(submissionStartAt) ?? seoulCalendarYmd(now)
  return {
    submissionStartAt,
    submissionEndAt: startYmd
      ? seoulEndOfCalendarDayIso(startYmd)
      : seoulEndOfCalendarDayIso(seoulStartOfNextCalendarDayIso(now).slice(0, 10)),
  }
}

/**
 * 양식 저장 시 바인딩 기간.
 * 「바로 시작」은 Asia/Seoul 오늘 00:00, 「마감 없음」은 열린 종료일.
 * custom 값이 있으면 그대로 두고, SURVEY가 요구하는 시작·종료를 항상 채운다.
 */
export function resolveSurveyBindingPeriodForFormSave(
  period: SurveySubmissionPeriod,
  now = new Date()
): { submissionStartAt: string; submissionEndAt: string } {
  return {
    submissionStartAt: period.submissionStartAt?.trim() || seoulStartOfTodayIso(now),
    submissionEndAt: period.submissionEndAt?.trim() || SURVEY_OPEN_ENDED_END_AT,
  }
}
