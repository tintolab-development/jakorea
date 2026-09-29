import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
  parseStoredEducationScheduleRange,
} from '@/features/template/lib/format-education-schedule-line'

export type EducationOperationRangeSeal = {
  start?: string | null
  end?: string | null
} | null

export function educationOperationRangeSealKeyFromSchedulePrefix(
  schedulePrefix: string
): string {
  const root = schedulePrefix.replace(/\.educationScheduleSettings$/, '')
  return `${root}.basicInfo.operationRangeSeal`
}

export function toEducationOperationDayjs(value: unknown): Dayjs | null {
  if (value == null || value === '') return null
  if (typeof value === 'string' && !value.trim()) return null
  const parsed = dayjs(value as string | number | Date)
  return parsed.isValid() ? parsed : null
}

export function isOutsideEducationOperationRange(
  date: Dayjs,
  start: Dayjs | null,
  end: Dayjs | null
): boolean {
  if (start != null && date.isBefore(start, 'day')) return true
  if (end != null && date.isAfter(end, 'day')) return true
  return false
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export const EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE = '교육 진행 일정 변경'
export const EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION =
  '일정 변경 시 같은 날짜에 교육 예정인 모든 기관의 일정도 함께 변경됩니다.'

export function padEducationScheduleChangeLabel(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function parseEducationScheduleLineToChangeRange(
  line: string
): [Dayjs, Dayjs] | null {
  return parseEducationScheduleLineToRange(line) ?? parseStoredEducationScheduleRange(line)
}

export function formatEducationScheduleLineForChangeModal(line: string): string {
  const range = parseEducationScheduleLineToChangeRange(line)
  if (!range) return line.trim() || '-'
  const [start, end] = range
  const dateLabel = `${start.format('YYYY.MM.DD')}(${WEEKDAY_KO[start.day()]})`
  if (start.isSame(end, 'day')) {
    if (!educationScheduleRangeHasClock(range)) return dateLabel
    return `${dateLabel} ${start.format('H:mm')} ~ ${end.format('H:mm')}`
  }
  const endDateLabel = `${end.format('YYYY.MM.DD')}(${WEEKDAY_KO[end.day()]})`
  if (!educationScheduleRangeHasClock(range)) return `${dateLabel} ~ ${endDateLabel}`
  return `${dateLabel} ${start.format('H:mm')} ~ ${endDateLabel} ${end.format('H:mm')}`
}

export function applyDateToEducationScheduleLine(line: string, nextDate: Dayjs): string {
  const range = parseEducationScheduleLineToChangeRange(line)
  if (!range) {
    return formatEducationScheduleLineFromRange([nextDate.startOf('day'), nextDate.startOf('day')])
  }
  const [start, end] = range
  const nextStart = nextDate.hour(start.hour()).minute(start.minute()).second(0).millisecond(0)
  if (start.isSame(end, 'day')) {
    const nextEnd = nextDate.hour(end.hour()).minute(end.minute()).second(0).millisecond(0)
    return formatEducationScheduleLineFromRange([nextStart, nextEnd])
  }
  const daySpan = end.startOf('day').diff(start.startOf('day'), 'day')
  const nextEndDate = nextDate.add(daySpan, 'day')
  const nextEnd = nextEndDate.hour(end.hour()).minute(end.minute()).second(0).millisecond(0)
  return formatEducationScheduleLineFromRange([nextStart, nextEnd])
}

export function applyChangedDatesToEducationScheduleLines(
  lines: readonly string[],
  changedDates: Record<number, Dayjs | null | undefined>
): string[] {
  return lines.map((line, index) => {
    const nextDate = changedDates[index]
    if (nextDate == null) return line
    return applyDateToEducationScheduleLine(line, nextDate)
  })
}

export function applyChangedRangesToEducationScheduleLines(
  lines: readonly string[],
  changedRanges: Record<number, [Dayjs, Dayjs] | null | undefined>
): string[] {
  return lines.map((line, index) => {
    const range = changedRanges[index]
    if (range == null) return line
    return formatEducationScheduleLineFromRange(range)
  })
}
