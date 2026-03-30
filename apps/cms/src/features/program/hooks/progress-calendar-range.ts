/**
 * 진행현황·신청자 캘린더 월간/주간 뷰 URL 연동
 * - progressCalendarRange=week (생략 시 월간)
 * - applicantsCalendarRange=week (생략 시 월간)
 */

export const PROGRESS_CALENDAR_RANGE_PARAM = 'progressCalendarRange'
export const APPLICANTS_CALENDAR_RANGE_PARAM = 'applicantsCalendarRange'

export type CalendarGranularity = 'month' | 'week'

export function parseCalendarRangeParam(
  searchParams: URLSearchParams,
  paramName: string
): CalendarGranularity {
  return searchParams.get(paramName) === 'week' ? 'week' : 'month'
}

export function applyCalendarRangeParam(
  next: URLSearchParams,
  paramName: string,
  mode: CalendarGranularity
): void {
  if (mode === 'month') next.delete(paramName)
  else next.set(paramName, 'week')
}
