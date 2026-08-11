import { addMonths, startOfDay, type CalendarDay } from '../pf-calendar/calendar-month'

/** Platform 날짜 인풋 공통 최소 연도 */
export const DATE_INPUT_MIN_YEAR = 1950

export function getDateInputMinDate(): Date {
  return startOfDay(new Date(DATE_INPUT_MIN_YEAR, 0, 1))
}

/** 당일 + 10년 (자정 기준) */
export function getDateInputMaxDate(now = new Date()): Date {
  const max = new Date(now)
  max.setFullYear(max.getFullYear() + 10)
  return startOfDay(max)
}

export function getDateInputMaxYear(now = new Date()): number {
  return now.getFullYear() + 10
}

export function getDateInputBounds(now = new Date()): { min: Date; max: Date } {
  return {
    min: getDateInputMinDate(),
    max: getDateInputMaxDate(now),
  }
}

export function isDateWithinInputBounds(date: Date, now = new Date()): boolean {
  const { min, max } = getDateInputBounds(now)
  const normalized = startOfDay(date)
  return normalized >= min && normalized <= max
}

export function isIsoDateWithinInputBounds(iso: string, now = new Date()): boolean {
  const date = parseIsoDate(iso)
  if (!date) return false
  return isDateWithinInputBounds(date, now)
}

export function isYearWithinInputBounds(year: number, now = new Date()): boolean {
  if (year < DATE_INPUT_MIN_YEAR || year > getDateInputMaxYear(now)) return false
  const { min, max } = getDateInputBounds(now)
  const yearStart = startOfDay(new Date(year, 0, 1))
  const yearEnd = startOfDay(new Date(year, 11, 31))
  return yearStart <= max && yearEnd >= min
}

export function isYearMonthWithinInputBounds(year: number, month: number, now = new Date()): boolean {
  const { min, max } = getDateInputBounds(now)
  const monthStart = startOfDay(new Date(year, month - 1, 1))
  const monthEnd = startOfDay(new Date(year, month, 0))
  return monthStart <= max && monthEnd >= min
}

export function clampViewMonth(viewMonth: Date, now = new Date()): Date {
  const { min, max } = getDateInputBounds(now)
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const minMonth = new Date(min.getFullYear(), min.getMonth(), 1)
  const maxMonth = new Date(max.getFullYear(), max.getMonth(), 1)
  if (monthStart < minMonth) return minMonth
  if (monthStart > maxMonth) return maxMonth
  return monthStart
}

export function canNavigateViewMonth(viewMonth: Date, direction: -1 | 1, now = new Date()): boolean {
  const { min, max } = getDateInputBounds(now)
  const minMonth = new Date(min.getFullYear(), min.getMonth(), 1)
  const maxMonth = new Date(max.getFullYear(), max.getMonth(), 1)
  const next = addMonths(viewMonth, direction)
  const nextMonth = new Date(next.getFullYear(), next.getMonth(), 1)
  return nextMonth >= minMonth && nextMonth <= maxMonth
}

export function canNavigateDecadePrev(decadeStart: number): boolean {
  return decadeStart + 10 >= DATE_INPUT_MIN_YEAR
}

export function canNavigateDecadeNext(decadeStart: number, now = new Date()): boolean {
  return decadeStart + 9 <= getDateInputMaxYear(now)
}

export function canNavigateViewYearPrev(viewYear: number): boolean {
  return viewYear > DATE_INPUT_MIN_YEAR
}

export function canNavigateViewYearNext(viewYear: number, now = new Date()): boolean {
  return viewYear < getDateInputMaxYear(now)
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return startOfDay(date)
}

/** `YYYY` */
export function parseYear(value: string): number | null {
  const match = /^(\d{4})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  if (year < 1000 || year > 9999) return null
  return year
}

export function toYearValue(year: number): string {
  return String(year)
}

export function formatDisplayYear(value: string): string {
  const year = parseYear(value)
  return year == null ? '' : String(year)
}

/** `YYYY-MM` */
export function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 1000 || year > 9999 || month < 1 || month > 12) return null
  return { year, month }
}

export function toYearMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function formatDisplayYearMonth(value: string): string {
  const parsed = parseYearMonth(value)
  if (!parsed) return ''
  return `${parsed.year}. ${String(parsed.month).padStart(2, '0')}`
}

/** 연대 시작 (예: 2024 → 2020) */
export function getDecadeStart(year: number): number {
  return Math.floor(year / 10) * 10
}

/** 연대 패널용 12개 연도: (decade-1) … (decade+10) */
export function getDecadePanelYears(decadeStart: number): number[] {
  const years: number[] = []
  for (let year = decadeStart - 1; year <= decadeStart + 10; year += 1) {
    years.push(year)
  }
  return years
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}. ${month}. ${day}`
}

/** 필터 트리거용 — `2026년 9월 13일` */
export function formatKoreanDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function formatKoreanDateRange(start: string, end: string): string {
  const startLabel = formatKoreanDate(start)
  const endLabel = formatKoreanDate(end)
  if (!startLabel || !endLabel) return ''
  return `${startLabel} ~ ${endLabel}`
}

export type DateRangeValue = {
  start: string | null
  end: string | null
}

/** `YYYY-MM-DD~YYYY-MM-DD` */
export function encodeDateRange(start: string, end: string): string {
  return start <= end ? `${start}~${end}` : `${end}~${start}`
}

export function parseDateRange(value: string): DateRangeValue | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'all') return null

  const rangeMatch = /^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})$/.exec(trimmed)
  if (rangeMatch) {
    const start = parseIsoDate(rangeMatch[1])
    const end = parseIsoDate(rangeMatch[2])
    if (!start || !end) return null
    const startIso = toIsoDate(start)
    const endIso = toIsoDate(end)
    return startIso <= endIso
      ? { start: startIso, end: endIso }
      : { start: endIso, end: startIso }
  }

  if (parseIsoDate(trimmed)) {
    return { start: trimmed, end: trimmed }
  }

  return null
}

export function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }
  return weeks
}
