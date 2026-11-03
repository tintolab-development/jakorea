import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const YMD_ONLY = /^\d{4}-\d{2}-\d{2}$/

export type BusinessCalendarPeriod = {
  start: string
  end: string
}

export const REGISTRATION_BUSINESS_PERIOD_ALERT_TITLE = '사업 운영 기간을 확인해 주세요'

/** Asia/Seoul 달력일(YYYY-MM-DD). ISO UTC를 앞 10자로 자르지 않는다. */
export function toBusinessPeriodCalendarYmd(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (YMD_ONLY.test(trimmed)) return trimmed
    const datePart = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T]/)
    if (datePart && !trimmed.includes('T') && !trimmed.includes('Z')) return datePart[1]
  }
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.format('YYYY-MM-DD') : null
  }
  if (value instanceof Date) {
    const time = value.getTime()
    if (Number.isNaN(time)) return null
    return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) return null
    return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10)
  }
  return null
}

export function readBusinessCalendarPeriod(raw: unknown): BusinessCalendarPeriod | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as { start?: unknown; end?: unknown }
  const start = toBusinessPeriodCalendarYmd(record.start)
  const end = toBusinessPeriodCalendarYmd(record.end)
  if (start == null || end == null) return null
  return start <= end ? { start, end } : { start: end, end: start }
}

export function isOutsideBusinessPeriod(
  date: Dayjs | string | Date | null | undefined,
  period: BusinessCalendarPeriod | null | undefined
): boolean {
  if (period == null) return true
  const ymd = toBusinessPeriodCalendarYmd(date)
  if (ymd == null) return true
  return ymd < period.start || ymd > period.end
}

export function isRangeWithinBusinessPeriod(
  start: Dayjs | string | Date | null | undefined,
  end: Dayjs | string | Date | null | undefined,
  period: BusinessCalendarPeriod | null | undefined
): boolean {
  if (period == null) return false
  const startYmd = toBusinessPeriodCalendarYmd(start)
  const endYmd = toBusinessPeriodCalendarYmd(end)
  if (startYmd == null || endYmd == null) return false
  const lo = startYmd <= endYmd ? startYmd : endYmd
  const hi = startYmd <= endYmd ? endYmd : startYmd
  return lo >= period.start && hi <= period.end
}

export function composeDisabledDate(
  businessPeriod: BusinessCalendarPeriod | null | undefined,
  existing?: (date: Dayjs) => boolean
): (date: Dayjs) => boolean {
  return (date: Dayjs) =>
    isOutsideBusinessPeriod(date, businessPeriod) || existing?.(date) === true
}

export function formatBusinessPeriodAlertDate(ymd: string): string {
  const [year, month, day] = ymd.split('-')
  if (!year || !month || !day) return ymd
  return `${year}.${month}.${day}`
}

export function buildRegistrationBusinessPeriodAlertContent(
  issues: readonly { fieldLabel: string; dateYmd: string }[],
  period: BusinessCalendarPeriod
): string {
  const range = `${formatBusinessPeriodAlertDate(period.start)} ~ ${formatBusinessPeriodAlertDate(period.end)}`
  return issues
    .map(
      issue =>
        `${issue.fieldLabel}(${formatBusinessPeriodAlertDate(issue.dateYmd)})이 사업 운영 기간(${range})을 벗어났습니다. 해당 일정을 수정해 주세요.`
    )
    .join('\n')
}
