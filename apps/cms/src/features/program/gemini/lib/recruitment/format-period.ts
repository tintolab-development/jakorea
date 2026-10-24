import { formatDateDot, formatDateRangeDot, formatDateTimeDotWithWeekday } from '@/shared/utils'

/** 목록 기간 날짜 — YYYY.MM.DD */
export function formatRecruitmentPeriodDate(iso: string): string {
  return formatDateDot(iso)
}

export function formatRecruitmentPeriodRange(start: string, end: string): string {
  return formatDateRangeDot(start, end)
}

/** `2025.12.08(월) 09:15` — 담당자명은 `DetailInfoForm.InputsSeparator`로 분리 */
export function formatRecruitmentAuditDate(iso: string): string {
  return formatDateTimeDotWithWeekday(iso)
}
