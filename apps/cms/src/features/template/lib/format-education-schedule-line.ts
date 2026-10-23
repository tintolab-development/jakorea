import dayjs, { type Dayjs } from 'dayjs'
import { dateRangeUsesClockTime } from '@/features/template/lib/date-range-clock'
import { CMS_WEEKDAY_KO, formatDateDotWithWeekday } from '@/shared/utils/date'

export type EducationScheduleGroupTimeSlot = {
  startTime?: string
  endTime?: string
}

/** 교육 진행 예정일 한 줄 표기 (예: `2026.04.20(월) 09:30 ~ 12:20`) */
export function formatEducationScheduleLineFromRange([start, end]: [Dayjs, Dayjs]): string {
  const startPart = formatDateDotWithWeekday(start)
  const hasTime = dateRangeUsesClockTime(start, end)
  if (start.isSame(end, 'day')) {
    if (hasTime) {
      return `${startPart} ${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
    }
    return startPart
  }

  const endPart = formatDateDotWithWeekday(end)
  if (hasTime) {
    return `${startPart} ${start.format('HH:mm')} ~ ${endPart} ${end.format('HH:mm')}`
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
/**
 * 「교육 진행 일정 선택」 [설정] — 개인·일정형·단일은 진행 시간 슬롯으로 예정일 줄 생성.
 * `disableTimeInputs` 팝오버는 onRangeChange만 호출하므로 range apply 경로에서도 동일 처리.
 */
export function educationScheduleLinesFromSelectionRangeApply(input: {
  range: [Dayjs, Dayjs]
  autoFillFromScheduleGroupTimes: boolean
  educationScheduleMode: 'date' | 'period'
  groupTimeSlots: Array<EducationScheduleGroupTimeSlot | null | undefined>
  dateOnlyPeriodRange: boolean
}): string[] {
  if (input.educationScheduleMode === 'period') {
    const normalized = normalizeEducationSchedulePeriodRangeDateOnly(input.range)
    return [formatEducationScheduleLineFromRange(normalized)]
  }
  if (input.autoFillFromScheduleGroupTimes) {
    const day = input.range[0].startOf('day')
    return buildEducationScheduleLinesFromDateAndGroupTimes(day, input.groupTimeSlots)
  }
  const normalized = input.dateOnlyPeriodRange
    ? normalizeEducationSchedulePeriodRangeDateOnly(input.range)
    : input.range
  return [formatEducationScheduleLineFromRange(normalized)]
}

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
const DOTTED_SCHEDULE_DATE_PART_RE = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/

function parseScheduleDatePartToken(part: string): Dayjs | null {
  const withoutWeekday = part.replace(/\([^)]*\)/g, '').trim()
  const dateOnly = withoutWeekday.replace(/\s+\d{1,2}:\d{2}.*$/, '').trim()
  const korean = dateOnly.match(SCHEDULE_DATE_PART_RE)
  if (korean) {
    const year = 2000 + Number(korean[1])
    const parsed = dayjs(`${year}-${korean[2]}-${korean[3]}`)
    return parsed.isValid() ? parsed : null
  }
  const dotted = dateOnly.match(DOTTED_SCHEDULE_DATE_PART_RE)
  if (!dotted) return null
  const parsed = dayjs(
    `${dotted[1]}-${String(dotted[2]).padStart(2, '0')}-${String(dotted[3]).padStart(2, '0')}`
  )
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

/** `2026.04.20(월) 09:30 ~ 12:20` 및 구 `26년 4월 20일(월)` 표기 → Dayjs 구간 */
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

/** 기관 일정형 단일 기간 — 저장·조회 시 시각 제거 */
export function normalizeEducationSchedulePeriodRangeDateOnly(
  range: [Dayjs, Dayjs]
): [Dayjs, Dayjs] {
  const sDay = range[0].isBefore(range[1], 'day') ? range[0] : range[1]
  const eDay = range[0].isBefore(range[1], 'day') ? range[1] : range[0]
  return [sDay.startOf('day'), eDay.startOf('day')]
}

export function normalizeEducationSchedulePeriodLineDateOnly(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  const range = parseEducationScheduleLineToRange(trimmed)
  if (!range) return trimmed
  return formatEducationScheduleLineFromRange(normalizeEducationSchedulePeriodRangeDateOnly(range))
}

export function educationScheduleRangeHasClock(range: [Dayjs, Dayjs]): boolean {
  return dateRangeUsesClockTime(range[0], range[1])
}

/** 아직 시작하지 않은 예정일만 true. 지난 날·당일 시작 후·기간 진행 중은 false. */
export function isEducationScheduleLineUpcoming(
  line: string,
  now: Dayjs = dayjs()
): boolean {
  const range = parseEducationScheduleLineToRange(line)
  if (!range) return false
  const [start] = range
  if (educationScheduleRangeHasClock(range)) return start.isAfter(now)
  return start.isAfter(now, 'day')
}

/** 같은 날·시각 없음이면 피커 트리거에 `날짜 ~ 날짜`가 나오지 않도록 null */
export function educationScheduleAppliedSurfaceRange(
  range: [Dayjs, Dayjs] | null
): [Dayjs, Dayjs] | null {
  if (!range) return null
  if (range[0].isSame(range[1], 'day') && !educationScheduleRangeHasClock(range)) return null
  return range
}

/** Overlay ISO 또는 교육 일정 표시 줄 → 피커 구간 */
export function parseStoredEducationScheduleRange(
  raw: string | null | undefined
): [Dayjs, Dayjs] | null {
  const fromLine = parseEducationScheduleLineToRange(raw ?? undefined)
  if (fromLine) return fromLine
  if (!raw?.trim()) return null
  const parsed = dayjs(raw)
  return parsed.isValid() ? [parsed, parsed] : null
}

export { countUniqueEducationScheduleCalendarDays } from '@jakorea/form-schema/program-application'

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

export function isCompleteEducationScheduleGroupTimeSlot(
  slot: EducationScheduleGroupTimeSlot | null | undefined
): boolean {
  if (!slot) return false
  const ref = dayjs().startOf('day')
  return (
    parseEducationScheduleClock(slot.startTime, ref) != null &&
    parseEducationScheduleClock(slot.endTime, ref) != null
  )
}

/** 예정일 목록에 새 줄을 중복 없이 합친다 (overlay·폼 단일 갱신용). */
export function mergeUniqueEducationScheduleLines(
  current: readonly string[],
  incoming: readonly string[]
): string[] {
  const next = [...current]
  for (const line of incoming) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (next.includes(trimmed)) continue
    next.push(trimmed)
  }
  return next
}

export function seoulCalendarDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** 파싱된 시작일이 서울 오늘보다 이전이면 true. 읽지 못하면 false. */
export function isEducationScheduleLineBeforeSeoulToday(
  line: string,
  now: Date = new Date()
): boolean {
  const range = parseEducationScheduleLineToRange(line)
  if (!range) return false
  return range[0].format('YYYY-MM-DD') < seoulCalendarDateKey(now)
}

/** 줄의 날짜를 옮기고 시각은 유지한다. 날짜를 읽지 못하면 선택한 날짜만 표기한다. */
const WEEKDAY_CLASS = '[일월화수목금토]'
const CMS_DATE_TOKEN = String.raw`(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\(${WEEKDAY_CLASS}\)`
const SERVER_DATE_TOKEN = String.raw`(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일\(${WEEKDAY_CLASS}\)`
const CLOCK_TOKEN = String.raw`(\d{1,2}:\d{2})`

const CMS_CROSS_DAY_TIME_RE = new RegExp(
  `^${CMS_DATE_TOKEN}\\s+${CLOCK_TOKEN}\\s*~\\s*${CMS_DATE_TOKEN}\\s+${CLOCK_TOKEN}$`
)
const CMS_SAME_DAY_TIME_RE = new RegExp(`^${CMS_DATE_TOKEN}\\s+${CLOCK_TOKEN}\\s*~\\s*${CLOCK_TOKEN}$`)
const CMS_PERIOD_RE = new RegExp(`^${CMS_DATE_TOKEN}\\s*~\\s*${CMS_DATE_TOKEN}$`)
const CMS_DATE_ONLY_RE = new RegExp(`^${CMS_DATE_TOKEN}$`)
const SERVER_CROSS_DAY_TIME_RE = new RegExp(
  `^${SERVER_DATE_TOKEN}\\s+${CLOCK_TOKEN}\\s*~\\s*${SERVER_DATE_TOKEN}\\s+${CLOCK_TOKEN}$`
)
const SERVER_SAME_DAY_TIME_RE = new RegExp(
  `^${SERVER_DATE_TOKEN}\\s+${CLOCK_TOKEN}\\s*~\\s*${CLOCK_TOKEN}$`
)
const SERVER_PERIOD_RE = new RegExp(`^${SERVER_DATE_TOKEN}\\s*~\\s*${SERVER_DATE_TOKEN}$`)
const SERVER_DATE_ONLY_RE = new RegExp(`^${SERVER_DATE_TOKEN}$`)
export const EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE =
  '교육 진행 예정일 형식을 확인해 주세요.'

type CalendarDate = { year: number; month: number; day: number }

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function readCalendarDate(year: number, month: number, day: number): CalendarDate | null {
  if (year < 2000 || year > 2099) return null
  if (!isValidCalendarDate(year, month, day)) return null
  return { year, month, day }
}

function clockToMinutes(token: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(token)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

function isChronologicalRange(
  start: CalendarDate,
  end: CalendarDate,
  startClock?: string,
  endClock?: string
): boolean {
  const startKey = start.year * 10000 + start.month * 100 + start.day
  const endKey = end.year * 10000 + end.month * 100 + end.day
  if (endKey < startKey) return false
  if (endKey > startKey || !startClock || !endClock) return true
  const startMinutes = clockToMinutes(startClock)
  const endMinutes = clockToMinutes(endClock)
  if (startMinutes == null || endMinutes == null) return false
  return endMinutes >= startMinutes
}

function calendarWeekday(date: CalendarDate): string {
  return CMS_WEEKDAY_KO[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()] ?? ''
}

function weekdaysMatchCalendar(line: string, dates: readonly CalendarDate[]): boolean {
  const found = [...line.matchAll(/\(([일월화수목금토])\)/g)].map(match => match[1] ?? '')
  return (
    found.length === dates.length &&
    dates.every((date, index) => found[index] === calendarWeekday(date))
  )
}

function formatServerEducationDate(date: CalendarDate): string {
  const year = String(date.year).slice(-2)
  return `${year}년 ${date.month}월 ${date.day}일(${calendarWeekday(date)})`
}

function readCmsDate(match: RegExpMatchArray, offset: number): CalendarDate | null {
  return readCalendarDate(
    Number(match[offset]),
    Number(match[offset + 1]),
    Number(match[offset + 2])
  )
}

function readServerDate(match: RegExpMatchArray, offset: number): CalendarDate | null {
  return readCalendarDate(
    2000 + Number(match[offset]),
    Number(match[offset + 1]),
    Number(match[offset + 2])
  )
}

function trySerializeCmsEducationScheduleLine(trimmed: string): string | null {
  const crossDay = trimmed.match(CMS_CROSS_DAY_TIME_RE)
  if (crossDay) {
    const start = readCmsDate(crossDay, 1)
    const end = readCmsDate(crossDay, 6)
    const startClock = crossDay[4]
    const endClock = crossDay[9]
    if (!start || !end || !startClock || !endClock) return null
    if (clockToMinutes(startClock) == null || clockToMinutes(endClock) == null) return null
    if (!isChronologicalRange(start, end, startClock, endClock)) return null
    return `${formatServerEducationDate(start)} ${startClock} ~ ${formatServerEducationDate(end)} ${endClock}`
  }

  const sameDay = trimmed.match(CMS_SAME_DAY_TIME_RE)
  if (sameDay) {
    const start = readCmsDate(sameDay, 1)
    const startClock = sameDay[4]
    const endClock = sameDay[5]
    if (!start || !startClock || !endClock) return null
    if (clockToMinutes(startClock) == null || clockToMinutes(endClock) == null) return null
    if (!isChronologicalRange(start, start, startClock, endClock)) return null
    return `${formatServerEducationDate(start)} ${startClock} ~ ${endClock}`
  }

  const period = trimmed.match(CMS_PERIOD_RE)
  if (period) {
    const start = readCmsDate(period, 1)
    const end = readCmsDate(period, 4)
    if (!start || !end || !isChronologicalRange(start, end)) return null
    return `${formatServerEducationDate(start)} ~ ${formatServerEducationDate(end)}`
  }

  const dateOnly = trimmed.match(CMS_DATE_ONLY_RE)
  if (dateOnly) {
    const start = readCmsDate(dateOnly, 1)
    if (!start) return null
    return formatServerEducationDate(start)
  }

  return null
}

function isValidServerScheduleMatch(trimmed: string): boolean {
  const crossDay = trimmed.match(SERVER_CROSS_DAY_TIME_RE)
  if (crossDay) {
    const start = readServerDate(crossDay, 1)
    const end = readServerDate(crossDay, 6)
    const startClock = crossDay[4]
    const endClock = crossDay[9]
    if (!start || !end || !startClock || !endClock) return false
    if (clockToMinutes(startClock) == null || clockToMinutes(endClock) == null) return false
    return (
      isChronologicalRange(start, end, startClock, endClock) &&
      weekdaysMatchCalendar(trimmed, [start, end])
    )
  }
  const sameDay = trimmed.match(SERVER_SAME_DAY_TIME_RE)
  if (sameDay) {
    const start = readServerDate(sameDay, 1)
    const startClock = sameDay[4]
    const endClock = sameDay[5]
    if (!start || !startClock || !endClock) return false
    if (clockToMinutes(startClock) == null || clockToMinutes(endClock) == null) return false
    return (
      isChronologicalRange(start, start, startClock, endClock) &&
      weekdaysMatchCalendar(trimmed, [start])
    )
  }
  const period = trimmed.match(SERVER_PERIOD_RE)
  if (period) {
    const start = readServerDate(period, 1)
    const end = readServerDate(period, 4)
    if (!start || !end) return false
    return isChronologicalRange(start, end) && weekdaysMatchCalendar(trimmed, [start, end])
  }
  const dateOnly = trimmed.match(SERVER_DATE_ONLY_RE)
  if (dateOnly) {
    const start = readServerDate(dateOnly, 1)
    return start != null && weekdaysMatchCalendar(trimmed, [start])
  }
  return false
}

function matchesEducationScheduleShape(trimmed: string): boolean {
  return (
    CMS_CROSS_DAY_TIME_RE.test(trimmed) ||
    CMS_SAME_DAY_TIME_RE.test(trimmed) ||
    CMS_PERIOD_RE.test(trimmed) ||
    CMS_DATE_ONLY_RE.test(trimmed) ||
    SERVER_CROSS_DAY_TIME_RE.test(trimmed) ||
    SERVER_SAME_DAY_TIME_RE.test(trimmed) ||
    SERVER_PERIOD_RE.test(trimmed) ||
    SERVER_DATE_ONLY_RE.test(trimmed)
  )
}

/** 서버 `parseSlot` / `parsePeriod` 문자열이면 다시 고치지 않는다. */
export function isCanonicalServerEducationScheduleLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  return isValidServerScheduleMatch(trimmed)
}

/**
 * CMS 표시 `2026.11.06(금) 10:00 ~ 12:00` → 서버 `26년 11월 6일(금) 10:00 ~ 12:00`.
 * 화면·RHF 값은 바꾸지 않고 API 전송 직전에만 쓴다.
 */
export function serializeEducationScheduleLineForServer(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return line
  if (isValidServerScheduleMatch(trimmed)) return trimmed
  return trySerializeCmsEducationScheduleLine(trimmed) ?? line
}

export function serializeEducationScheduleLinesForServer(lines: readonly string[]): string[] {
  return lines.map(line => serializeEducationScheduleLineForServer(line))
}

/** 일정처럼 보이지만 서버 형식으로 보낼 수 없으면 안내 문구. 자유입력은 null. */
export function educationScheduleLineSerializationIssue(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || !matchesEducationScheduleShape(trimmed)) return null
  if (isValidServerScheduleMatch(trimmed)) return null
  if (trySerializeCmsEducationScheduleLine(trimmed)) return null
  return EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE
}

/**
 * 서버 교육 예정일 → CMS 표시 `YYYY.MM.DD(요일)`.
 * 이미 CMS 형식이거나 일정 문자열이 아니면 원문을 유지한다.
 */
export function parseEducationScheduleLineForCms(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return line
  if (educationScheduleLineSerializationIssue(trimmed)) return line
  if (!isValidServerScheduleMatch(trimmed) && !trySerializeCmsEducationScheduleLine(trimmed)) {
    return line
  }
  const range = parseEducationScheduleLineToRange(trimmed)
  if (!range) return line
  return formatEducationScheduleLineFromRange(range)
}

export function parseEducationScheduleLinesForCms(lines: readonly string[]): string[] {
  return lines.map(line => parseEducationScheduleLineForCms(line))
}

export function shiftEducationScheduleLineToDate(line: string, nextDate: Dayjs): string {
  const range = parseEducationScheduleLineToRange(line)
  if (!range) {
    return formatEducationScheduleLineFromRange([nextDate.startOf('day'), nextDate.startOf('day')])
  }
  const [start, end] = range
  const deltaDays = nextDate.startOf('day').diff(start.startOf('day'), 'day')
  return formatEducationScheduleLineFromRange([
    start.add(deltaDays, 'day'),
    end.add(deltaDays, 'day'),
  ])
}
