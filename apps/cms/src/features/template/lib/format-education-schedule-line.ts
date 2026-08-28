import dayjs, { type Dayjs } from 'dayjs'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export type EducationScheduleGroupTimeSlot = {
  startTime?: string
  endTime?: string
}

/** 교육 진행 예정일 한 줄 표기 (예: `26년 4월 20일(월) 9:30 ~ 12:20`) */
export function formatEducationScheduleLineFromRange([start, end]: [Dayjs, Dayjs]): string {
  const formatDatePart = (d: Dayjs) => {
    const yy = d.year() % 100
    return `${yy}년 ${d.month() + 1}월 ${d.date()}일(${WEEKDAY_KO[d.day()]})`
  }

  const startPart = formatDatePart(start)
  if (start.isSame(end, 'day')) {
    const hasTime =
      !(start.hour() === 0 && start.minute() === 0 && end.hour() === 0 && end.minute() === 0)
    if (hasTime) {
      return `${startPart} ${start.format('H:mm')} ~ ${end.format('H:mm')}`
    }
    return startPart
  }

  const endPart = formatDatePart(end)
  const startHasTime = start.hour() !== 0 || start.minute() !== 0
  const endHasTime = end.hour() !== 0 || end.minute() !== 0
  if (startHasTime || endHasTime) {
    return `${startPart} ${start.format('H:mm')} ~ ${endPart} ${end.format('H:mm')}`
  }
  return `${startPart} ~ ${endPart}`
}

/** `9:00` / `09:00` → 선택 날짜에 올린 Dayjs */
export function parseEducationScheduleClock(
  time: string | undefined,
  date: Dayjs
): Dayjs | null {
  if (!time?.trim()) return null
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return date.hour(hour).minute(minute).second(0).millisecond(0)
}

export function flattenGroupTimeSlotsByDetail(
  byDetail:
    | Record<number, Array<EducationScheduleGroupTimeSlot | null | undefined>>
    | undefined
): EducationScheduleGroupTimeSlot[] {
  if (!byDetail) return []
  const detailIndexes = Object.keys(byDetail)
    .map(Number)
    .filter(n => Number.isInteger(n))
    .sort((a, b) => a - b)
  const slots: EducationScheduleGroupTimeSlot[] = []
  for (const index of detailIndexes) {
    for (const slot of byDetail[index] ?? []) {
      if (slot) slots.push(slot)
    }
  }
  return slots
}

/**
 * 날짜 지정 + 진행 시간 슬롯 → 교육 진행 예정일 줄.
 * 시작·종료가 있는 슬롯만 한 줄씩. 전부 비면 날짜만 한 줄.
 */
export function buildEducationScheduleLinesFromDateAndGroupTimes(
  date: Dayjs,
  slots: Array<EducationScheduleGroupTimeSlot | null | undefined>
): string[] {
  const lines: string[] = []
  for (const slot of slots) {
    const start = parseEducationScheduleClock(slot?.startTime, date)
    const end = parseEducationScheduleClock(slot?.endTime, date)
    if (!start || !end) continue
    lines.push(formatEducationScheduleLineFromRange([start, end]))
  }
  if (lines.length === 0) {
    const day = date.startOf('day')
    return [formatEducationScheduleLineFromRange([day, day])]
  }
  return lines
}

const SCHEDULE_DATE_PART_RE = /^(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/

function parseScheduleDatePartToken(part: string): Dayjs | null {
  const withoutWeekday = part.replace(/\([^)]*\)/g, '').trim()
  const dateOnly = withoutWeekday.replace(/\s+\d{1,2}:\d{2}.*$/, '').trim()
  const match = dateOnly.match(SCHEDULE_DATE_PART_RE)
  if (!match) return null
  const yy = Number(match[1])
  const year = 2000 + yy
  const parsed = dayjs(`${year}-${match[2]}-${match[3]}`)
  return parsed.isValid() ? parsed : null
}

function parseClockToken(part: string): string | undefined {
  const match = part.match(/(\d{1,2}):(\d{2})/)
  if (!match) return undefined
  return `${Number(match[1])}:${match[2]}`
}

function applyScheduleClock(date: Dayjs, token: string): Dayjs {
  const clock = parseEducationScheduleClock(parseClockToken(token), date)
  return clock ?? date.startOf('day')
}

/** `26년 4월 20일(월) 9:30 ~ 12:20` 등 → Dayjs 구간 (피커 표면·시간 복원용) */
export function parseEducationScheduleLineToRange(line: string | undefined): [Dayjs, Dayjs] | null {
  const trimmed = line?.trim()
  if (!trimmed) return null

  const segments = trimmed.split(/\s*~\s*/)
  const startToken = segments[0] ?? ''
  const startDate = parseScheduleDatePartToken(startToken)
  if (!startDate) return null

  const start = applyScheduleClock(startDate, startToken)
  if (segments.length < 2) return [start, start]

  const endToken = segments[segments.length - 1] ?? ''
  const endDate = parseScheduleDatePartToken(endToken)
  if (!endDate) {
    const end = parseEducationScheduleClock(parseClockToken(endToken), startDate)
    return end ? [start, end] : [start, start]
  }

  return [start, applyScheduleClock(endDate, endToken)]
}

export function educationScheduleRangeHasClock(range: [Dayjs, Dayjs]): boolean {
  const [start, end] = range
  return start.hour() !== 0 || start.minute() !== 0 || end.hour() !== 0 || end.minute() !== 0
}

/** 같은 날·시각 없음이면 피커 트리거에 `날짜 ~ 날짜`가 나오지 않도록 null */
export function educationScheduleAppliedSurfaceRange(
  range: [Dayjs, Dayjs] | null
): [Dayjs, Dayjs] | null {
  if (!range) return null
  if (range[0].isSame(range[1], 'day') && !educationScheduleRangeHasClock(range)) return null
  return range
}

/** 같은 날 예정일 줄에서 날짜만 중복 없이 추출 (기간 지정 여러 날은 제외) */
export function uniqueSameDayDatesFromScheduleLines(lines: string[]): Dayjs[] {
  const seen = new Set<string>()
  const dates: Dayjs[] = []
  for (const line of lines) {
    const range = parseEducationScheduleLineToRange(line)
    if (!range) continue
    const [start, end] = range
    if (!start.isSame(end, 'day')) continue
    const key = start.format('YYYY-MM-DD')
    if (seen.has(key)) continue
    seen.add(key)
    dates.push(start.startOf('day'))
  }
  return dates
}

function isMultiDayScheduleLine(line: string): boolean {
  const range = parseEducationScheduleLineToRange(line)
  if (!range) return true
  return !range[0].isSame(range[1], 'day')
}

/**
 * 이미 고른 날짜 줄에 진행 시간 슬롯을 다시 입힌다.
 * 기간(여러 날) 줄은 유지한다.
 */
export function rebuildEducationScheduleLinesFromGroupTimes(
  existingLines: string[],
  slots: Array<EducationScheduleGroupTimeSlot | null | undefined>
): string[] {
  const dates = uniqueSameDayDatesFromScheduleLines(existingLines)
  if (dates.length === 0) {
    return existingLines.filter(isMultiDayScheduleLine)
  }
  const rebuilt = dates.flatMap(date =>
    buildEducationScheduleLinesFromDateAndGroupTimes(date, slots)
  )
  const periodLines = existingLines.filter(isMultiDayScheduleLine)
  return [...rebuilt, ...periodLines]
}

export function educationScheduleLinesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((line, index) => line === b[index])
}
