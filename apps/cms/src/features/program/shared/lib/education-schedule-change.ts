import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
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

export function educationOperationRangeSealKeyFromSchedulePrefix(schedulePrefix: string): string {
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

function seoulTodayDateKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** 캘린더 날짜(달력 칸)가 서울 기준 오늘보다 앞인지. 오늘은 선택 가능. */
export function isBeforeEducationScheduleSeoulToday(date: Dayjs, now: Date = new Date()): boolean {
  if (!date.isValid()) return false
  return date.format('YYYY-MM-DD') < seoulTodayDateKey(now)
}

/**
 * 「교육 진행 일정 설정」 캘린더 비활성 날짜 — 사업 운영 기간 밖 + 오늘(서울) 이전.
 * - 운영 기간이 비어 있으면 그쪽 경계는 제한하지 않는다(시작만/종료만 있으면 있는 쪽만).
 * - 이미 저장된 예정일은 지우지 않는다 — 새로 고르는 날짜만 막는다.
 */
export function isEducationScheduleSelectionDateDisabled(
  date: Dayjs,
  operationStart: Dayjs | null,
  operationEnd: Dayjs | null,
  now: Date = new Date()
): boolean {
  return (
    isOutsideEducationOperationRange(date, operationStart, operationEnd) ||
    isBeforeEducationScheduleSeoulToday(date, now)
  )
}

export type EducationScheduleChangePeriodIssue = {
  index: number
  fromDate: string
  toDate: string
  sourceOutsideOperationRange: boolean
  targetOutsideOperationRange: boolean
}

export function findEducationScheduleLinesOutsideOperationRange(
  lines: readonly string[],
  operationStart: unknown,
  operationEnd: unknown
): number[] {
  const start = toEducationOperationDayjs(operationStart)
  const end = toEducationOperationDayjs(operationEnd)
  if (start == null && end == null) return []

  return lines.reduce<number[]>((indices, line, index) => {
    const range = parseEducationScheduleLineToChangeRange(line)
    if (educationScheduleRangeOutsideOperationRange(range, start, end)) {
      indices.push(index)
    }
    return indices
  }, [])
}

function educationScheduleRangeOutsideOperationRange(
  range: [Dayjs, Dayjs] | null,
  start: Dayjs | null,
  end: Dayjs | null
): boolean {
  if (range == null) return false
  return (
    isOutsideEducationOperationRange(range[0], start, end) ||
    isOutsideEducationOperationRange(range[1], start, end)
  )
}

/**
 * 사업 운영기간 변경 뒤 일정 변경 API가 거절할 수 있는 이동을 미리 찾는다.
 * 특히 기간을 줄여 기존 일정의 fromDate가 기간 밖에 남은 경우를 저장 전에 막는다.
 */
export function findEducationScheduleChangePeriodIssues(
  previousLines: readonly string[],
  nextLines: readonly string[],
  operationStart: unknown,
  operationEnd: unknown
): EducationScheduleChangePeriodIssue[] {
  const start = toEducationOperationDayjs(operationStart)
  const end = toEducationOperationDayjs(operationEnd)
  if (start == null && end == null) return []

  const length = Math.max(previousLines.length, nextLines.length)
  const issues: EducationScheduleChangePeriodIssue[] = []
  for (let index = 0; index < length; index += 1) {
    const previousLine = previousLines[index] ?? ''
    const nextLine = nextLines[index] ?? ''
    if (previousLine === nextLine) continue

    const previousRange = parseEducationScheduleLineToChangeRange(previousLine)
    const nextRange = parseEducationScheduleLineToChangeRange(nextLine)
    if (previousRange == null || nextRange == null) continue

    const sourceOutsideOperationRange = educationScheduleRangeOutsideOperationRange(
      previousRange,
      start,
      end
    )
    const targetOutsideOperationRange = educationScheduleRangeOutsideOperationRange(
      nextRange,
      start,
      end
    )
    if (!sourceOutsideOperationRange && !targetOutsideOperationRange) continue

    issues.push({
      index,
      fromDate: previousRange[0].format('YYYY-MM-DD'),
      toDate: nextRange[0].format('YYYY-MM-DD'),
      sourceOutsideOperationRange,
      targetOutsideOperationRange,
    })
  }
  return issues
}

export const EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE = '교육 진행 일정 변경'
export const EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION =
  '일정 변경 시 같은 날짜에 교육 예정인 모든 기관의 일정도 함께 변경됩니다.'

export function padEducationScheduleChangeLabel(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function parseEducationScheduleLineToChangeRange(line: string): [Dayjs, Dayjs] | null {
  return parseEducationScheduleLineToRange(line) ?? parseStoredEducationScheduleRange(line)
}

export function formatEducationScheduleLineForChangeModal(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return '-'
  const direct = formatCmsScheduleDisplayLabel(trimmed)
  if (direct !== trimmed) return direct
  const range = parseEducationScheduleLineToChangeRange(trimmed)
  if (!range) return trimmed
  const [start, end] = range
  const startToken = start.format('YYYY-MM-DD')
  const endToken = end.format('YYYY-MM-DD')
  if (!educationScheduleRangeHasClock(range)) {
    return formatCmsScheduleDisplayLabel(
      start.isSame(end, 'day') ? startToken : `${startToken} ~ ${endToken}`
    )
  }
  const startAt = `${startToken} ${start.format('HH:mm')}`
  const endAt = start.isSame(end, 'day')
    ? end.format('HH:mm')
    : `${endToken} ${end.format('HH:mm')}`
  return formatCmsScheduleDisplayLabel(`${startAt} ~ ${endAt}`)
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
  changedRanges: Record<number, [Dayjs, Dayjs] | null | undefined>,
  options?: { keepOriginalTimeWhenDateOnly?: boolean }
): string[] {
  return lines.map((line, index) => {
    const range = changedRanges[index]
    if (range == null) return line
    const originalRange = parseEducationScheduleLineToChangeRange(line)
    /**
     * 시간 입력이 없는 선택(일정형 자동 시간·시간 비활성)은 날짜만 옮기고 기존 시간을 유지한다.
     * 시간까지 고른 선택은 그 범위를 그대로 쓴다.
     */
    if (
      options?.keepOriginalTimeWhenDateOnly &&
      !educationScheduleRangeHasClock(range) &&
      originalRange != null &&
      educationScheduleRangeHasClock(originalRange)
    ) {
      return applyDateToEducationScheduleLine(line, range[0])
    }
    return formatEducationScheduleLineFromRange(range)
  })
}

export type SameDateScheduleChangePair = {
  fromDate: string
  toDate: string
}

/**
 * 팝업에서 바뀐 일정 줄마다 시작 달력일을 fromDate→toDate로 만든다.
 * 같은 쌍은 한 번만. `same-date` API 본문에 쓴다.
 */
export function buildSameDateScheduleChangePairs(
  previousLines: readonly string[],
  nextLines: readonly string[]
): SameDateScheduleChangePair[] {
  const seen = new Set<string>()
  const pairs: SameDateScheduleChangePair[] = []
  const length = Math.max(previousLines.length, nextLines.length)
  for (let index = 0; index < length; index += 1) {
    const prev = previousLines[index] ?? ''
    const next = nextLines[index] ?? ''
    if (prev === next) continue
    const prevRange = parseEducationScheduleLineToChangeRange(prev)
    const nextRange = parseEducationScheduleLineToChangeRange(next)
    if (!prevRange || !nextRange) continue
    const fromDate = prevRange[0].format('YYYY-MM-DD')
    const toDate = nextRange[0].format('YYYY-MM-DD')
    if (fromDate === toDate) continue
    const key = `${fromDate}->${toDate}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ fromDate, toDate })
  }
  return pairs
}

/**
 * 이미 지나간 일정인지 — 일정 변경 모달에서 노출·수정하지 않는다.
 * 시간이 있는 일정은 시작 시각, 날짜만 있는 일정은 시작일(오늘 이전) 기준.
 */
export function isEducationScheduleLinePast(line: string, now: Dayjs = dayjs()): boolean {
  const range = parseEducationScheduleLineToChangeRange(line)
  if (range == null) return false
  if (educationScheduleRangeHasClock(range)) return !range[0].isAfter(now)
  return range[0].isBefore(now, 'day')
}
