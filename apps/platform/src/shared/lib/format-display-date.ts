/** Platform 기간·일정 표시 SSOT. 게시일·입력값 포맷과 분리한다. */

import { stripDefaultEducationSlotNameFromLabel } from './education-schedule-name.ts'

export const DISPLAY_DATE_TIMEZONE = 'Asia/Seoul'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const SEOUL_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
})

const ISO_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DATETIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/
const ISO_EXPLICIT_TZ_RE = /(?:Z|[+-]\d{2}:?\d{2})\s*$/i
const WEEKDAY_PAREN_RE = /(?:\s*\([일월화수목금토]\))?/
const KOREAN_DATE_RE = new RegExp(
  String.raw`(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일${WEEKDAY_PAREN_RE.source}`,
)
const DOTTED_DATE_RE = new RegExp(
  String.raw`(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})${WEEKDAY_PAREN_RE.source}`,
)
const CLOCK_RE = /(\d{1,2}):(\d{2})(?::\d{2})?/
const TIME_ONLY_RE = /^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/
const DATE_LIKE_START_RE = /^(?:\d{2,4}년|\d{4}[.-])/
const ALL_DAY_QUALIFIER_RE = /\s*종일\s*$/

export type DisplayDateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  hasTime: boolean
}

export type FormatDisplayRangeOptions = {
  empty?: string
  dateOnly?: boolean
  /** 기본 true. false면 `2026년 8월 15일`처럼 요일을 붙이지 않는다. */
  weekday?: boolean
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function expandYear(raw: string): number {
  return raw.length === 2 ? 2000 + Number(raw) : Number(raw)
}

function weekdayKo(year: number, month: number, day: number): string {
  return WEEKDAY_KO[new Date(year, month - 1, day).getDay()] ?? ''
}

function sameCalendarDay(a: DisplayDateTimeParts, b: DisplayDateTimeParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

function seoulPartsFromDate(date: Date, hasTime: boolean): DisplayDateTimeParts | null {
  if (Number.isNaN(date.getTime())) return null
  const bag = SEOUL_PARTS.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(bag.find(part => part.type === type)?.value)
  const year = value('year')
  const month = value('month')
  const day = value('day')
  const hour = value('hour')
  const minute = value('minute')
  const second = value('second')
  if (!isValidYmd(year, month, day)) return null
  return {
    year,
    month,
    day,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
    second: Number.isFinite(second) ? second : 0,
    hasTime,
  }
}

function calendarParts(year: number, month: number, day: number): DisplayDateTimeParts | null {
  if (!isValidYmd(year, month, day)) return null
  return { year, month, day, hour: 0, minute: 0, second: 0, hasTime: false }
}

function withTime(
  parts: DisplayDateTimeParts,
  hour: number,
  minute: number,
  second = 0,
): DisplayDateTimeParts | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  if (!Number.isInteger(second) || second < 0 || second > 59) return null
  return { ...parts, hour, minute, second, hasTime: true }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function hasExplicitTimeZone(value: string): boolean {
  return ISO_EXPLICIT_TZ_RE.test(value.trim())
}

/**
 * ISO instant(`Z`/offset)는 서울 달력·시각으로 변환한다.
 * 시간대가 없는 `YYYY-MM-DD` / `YYYY-MM-DD[T ]HH:mm` 은 서버 KST 벽시계로 보고 그대로 둔다.
 */
export function toSeoulDisplayParts(
  input: Date | string | null | undefined,
): DisplayDateTimeParts | null {
  if (input == null || input === '') return null
  if (input instanceof Date) return seoulPartsFromDate(input, true)
  const trimmed = input.trim()
  if (!trimmed) return null

  const dateOnly = parseIsoDateOnly(trimmed)
  if (dateOnly) return dateOnly

  const isoDateTime = ISO_DATETIME_RE.exec(trimmed)
  if (isoDateTime) {
    if (hasExplicitTimeZone(trimmed)) {
      return seoulPartsFromDate(new Date(trimmed), true)
    }
    const base = calendarParts(
      Number(isoDateTime[1]),
      Number(isoDateTime[2]),
      Number(isoDateTime[3]),
    )
    if (!base) return null
    return withTime(
      base,
      Number(isoDateTime[4]),
      Number(isoDateTime[5]),
      isoDateTime[6] != null ? Number(isoDateTime[6]) : 0,
    )
  }

  if (trimmed.includes('T')) {
    return seoulPartsFromDate(new Date(trimmed), true)
  }
  return null
}

/** ISO instant → 서울 달력 `YYYY-MM-DD`. 날짜만 오면 그대로. */
export function toSeoulDateOnly(input: Date | string | null | undefined): string | undefined {
  const parts = toSeoulDisplayParts(input)
  if (!parts) return undefined
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

/** `YYYY.MM.DD` 또는 `YYYY.MM.DD HH:mm` (동의일시 등). */
export function formatDottedSeoulDateTime(
  input: Date | string | null | undefined,
  options: { seconds?: boolean } = {},
): string | undefined {
  const parts = toSeoulDisplayParts(input)
  if (!parts) return undefined
  const date = `${parts.year}.${pad2(parts.month)}.${pad2(parts.day)}`
  if (!parts.hasTime) return date
  const clock = `${pad2(parts.hour)}:${pad2(parts.minute)}`
  if (options.seconds) return `${date} ${clock}:${pad2(parts.second)}`
  return `${date} ${clock}`
}

/** `YYYY년 MM월 DD일` (서명란). */
export function formatPaddedKoreanSeoulDate(
  input: Date | string | null | undefined,
): string {
  const parts = toSeoulDisplayParts(input)
  if (!parts) return ''
  return `${parts.year}년 ${pad2(parts.month)}월 ${pad2(parts.day)}일`
}

export function formatDisplayClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDisplayClockLabel(raw: string): string {
  const match = TIME_ONLY_RE.exec(raw.trim()) ?? CLOCK_RE.exec(raw.trim())
  if (!match) return raw.trim()
  return formatDisplayClock(Number(match[1]), Number(match[2]))
}

export function formatDisplayDateParts(
  parts: Pick<DisplayDateTimeParts, 'year' | 'month' | 'day'>,
  weekday = true,
): string {
  const date = `${parts.year}년 ${parts.month}월 ${parts.day}일`
  if (!weekday) return date
  return `${date}(${weekdayKo(parts.year, parts.month, parts.day)})`
}

function formatDateTimeParts(parts: DisplayDateTimeParts): string {
  return `${formatDisplayDateParts(parts)} ${formatDisplayClock(parts.hour, parts.minute)}`
}

function parseIsoDateOnly(value: string): DisplayDateTimeParts | null {
  const match = ISO_DATE_ONLY_RE.exec(value.trim())
  if (!match) return null
  return calendarParts(Number(match[1]), Number(match[2]), Number(match[3]))
}

function parseSource(input: Date | string, mode: 'date' | 'datetime'): DisplayDateTimeParts | null {
  if (input instanceof Date) return seoulPartsFromDate(input, mode === 'datetime')
  const trimmed = input.trim()
  if (!trimmed) return null
  const dateOnly = parseIsoDateOnly(trimmed)
  if (dateOnly) {
    return mode === 'datetime' ? { ...dateOnly, hasTime: true } : dateOnly
  }
  if (ISO_DATETIME_RE.test(trimmed) || trimmed.includes('T')) {
    const date = new Date(trimmed)
    return seoulPartsFromDate(date, mode === 'datetime')
  }
  const fromLabel = parseInstantFromSegment(trimmed)
  if (fromLabel) {
    return mode === 'date' ? { ...fromLabel, hasTime: false, hour: 0, minute: 0, second: 0 } : fromLabel
  }
  const date = new Date(trimmed)
  return seoulPartsFromDate(date, mode === 'datetime')
}

export function formatDisplayDate(input: Date | string | null | undefined): string {
  if (input == null || input === '') return ''
  const parts = parseSource(input, 'date')
  return parts ? formatDisplayDateParts(parts) : ''
}

export function formatDisplayDateTime(input: Date | string | null | undefined): string {
  if (input == null || input === '') return ''
  const parts = parseSource(input, 'datetime')
  if (!parts) return ''
  if (!parts.hasTime || (parts.hour === 0 && parts.minute === 0 && parts.second === 0)) {
    return formatDisplayDateParts(parts)
  }
  return formatDateTimeParts(parts)
}

export function formatDisplayDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  options: FormatDisplayRangeOptions = {},
): string {
  const empty = options.empty ?? '-'
  const weekday = options.weekday !== false
  const startParts = start == null || start === '' ? null : parseSource(start, 'date')
  const endParts = end == null || end === '' ? null : parseSource(end, 'date')
  if (!startParts && !endParts) return empty
  if (startParts && !endParts) return formatDisplayDateParts(startParts, weekday)
  if (!startParts && endParts) return formatDisplayDateParts(endParts, weekday)
  if (sameCalendarDay(startParts!, endParts!)) return formatDisplayDateParts(startParts!, weekday)
  return `${formatDisplayDateParts(startParts!, weekday)} ~ ${formatDisplayDateParts(endParts!, weekday)}`
}

/** 모집기간처럼 날짜만 짧게 표시할 때 사용한다. 같은 연도는 종료일의 연도를 생략한다. */
export function formatDisplayDateRangeCompact(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  options: FormatDisplayRangeOptions = {},
): string {
  const empty = options.empty ?? '-'
  const startParts = start == null || start === '' ? null : parseSource(start, 'date')
  const endParts = end == null || end === '' ? null : parseSource(end, 'date')
  if (!startParts && !endParts) return empty

  const formatDate = (parts: DisplayDateTimeParts, includeYear = true) =>
    includeYear
      ? `${parts.year}년 ${parts.month}월 ${parts.day}일`
      : `${parts.month}월 ${parts.day}일`

  if (startParts && !endParts) return formatDate(startParts)
  if (!startParts && endParts) return formatDate(endParts)
  if (sameCalendarDay(startParts!, endParts!)) return formatDate(startParts!)

  return `${formatDate(startParts!)} ~ ${formatDate(endParts!, startParts!.year !== endParts!.year)}`
}

export function formatDisplayDateTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  options: FormatDisplayRangeOptions = {},
): string {
  const empty = options.empty ?? ''
  const startParts = start == null || start === '' ? null : parseSource(start, 'datetime')
  const endParts = end == null || end === '' ? null : parseSource(end, 'datetime')
  if (!startParts && !endParts) return empty
  if (startParts && !endParts) return formatDisplayDateTime(start)
  if (!startParts && endParts) return formatDisplayDateTime(end)
  return formatRangeParts(startParts!, endParts!, options.dateOnly === true)
}

function formatRangeParts(
  start: DisplayDateTimeParts,
  end: DisplayDateTimeParts,
  dateOnly: boolean,
): string {
  const startClock = start.hasTime && !(start.hour === 0 && start.minute === 0 && start.second === 0)
  const endClock = end.hasTime && !(end.hour === 0 && end.minute === 0 && end.second === 0)
  if (dateOnly || (!startClock && !endClock)) {
    return formatDisplayDateRange(
      `${start.year}-${String(start.month).padStart(2, '0')}-${String(start.day).padStart(2, '0')}`,
      `${end.year}-${String(end.month).padStart(2, '0')}-${String(end.day).padStart(2, '0')}`,
      { empty: '' },
    )
  }
  if (sameCalendarDay(start, end)) {
    return `${formatDisplayDateParts(start)} ${formatDisplayClock(start.hour, start.minute)} ~ ${formatDisplayClock(end.hour, end.minute)}`
  }
  return `${formatDateTimeParts(start)} ~ ${formatDateTimeParts(end)}`
}

export function isScheduleDateLikeText(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return (
    DATE_LIKE_START_RE.test(trimmed) ||
    KOREAN_DATE_RE.test(trimmed) ||
    DOTTED_DATE_RE.test(trimmed) ||
    ISO_DATE_ONLY_RE.test(trimmed) ||
    ISO_DATETIME_RE.test(trimmed)
  )
}

function parseClock(raw: string): { hour: number; minute: number } | null {
  const match = CLOCK_RE.exec(raw.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function parseTimeOnly(raw: string): DisplayDateTimeParts | null {
  const match = TIME_ONLY_RE.exec(raw)
  if (!match) return null
  const clock = parseClock(match[0])
  if (!clock) return null
  return { year: 1970, month: 1, day: 1, hour: clock.hour, minute: clock.minute, second: 0, hasTime: true }
}

function parseInstantFromSegment(segment: string): DisplayDateTimeParts | null {
  const trimmed = segment.trim()
  if (!trimmed) return null

  const isoDateTime = ISO_DATETIME_RE.exec(trimmed)
  if (isoDateTime) {
    return seoulPartsFromDate(new Date(trimmed), true)
  }

  const isoDate = ISO_DATE_ONLY_RE.exec(trimmed)
  if (isoDate) {
    const base = calendarParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))
    if (!base) return null
    const afterIso = trimmed.slice(isoDate[0].length).trim()
    const clock = afterIso && !afterIso.includes('~') ? parseClock(afterIso) : null
    return clock ? withTime(base, clock.hour, clock.minute) : base
  }

  const korean = KOREAN_DATE_RE.exec(trimmed)
  const dotted = korean ? null : DOTTED_DATE_RE.exec(trimmed)
  const matched = korean ?? dotted
  if (!matched) return null

  const year = korean ? expandYear(korean[1]!) : Number(dotted![1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  const base = calendarParts(year, month, day)
  if (!base) return null

  const after = trimmed.slice(matched.index + matched[0].length).trim()
  const paren = /^\(([^)]+)\)/.exec(after)
  const timeSrc = paren ? paren[1]! : after
  if (timeSrc.includes('~')) return base
  const clock = parseClock(timeSrc)
  return clock ? withTime(base, clock.hour, clock.minute) : base
}

function splitRangeOutsideParens(text: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  for (const ch of text) {
    if (ch === '(') depth += 1
    if (ch === ')' && depth > 0) depth -= 1
    if (depth === 0 && (ch === '~' || ch === '–' || ch === '—')) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts.filter(Boolean)
}

function parseParenTimeRange(segment: string): { start: DisplayDateTimeParts; end: DisplayDateTimeParts } | null {
  const date = parseInstantFromSegment(segment)
  if (!date) return null
  const matched = KOREAN_DATE_RE.exec(segment) ?? DOTTED_DATE_RE.exec(segment)
  if (!matched) return null
  const after = segment.slice(matched.index + matched[0].length).trim()
  const paren = /^\(([^)]+)\)/.exec(after)
  if (!paren) return null
  const clocks = [...paren[1]!.matchAll(/(\d{1,2}):(\d{2})/g)]
  if (clocks.length < 2) return null
  const start = withTime(date, Number(clocks[0]![1]), Number(clocks[0]![2]))
  const end = withTime(date, Number(clocks[1]![1]), Number(clocks[1]![2]))
  if (!start || !end) return null
  return { start, end }
}

function parseRangeBody(text: string): { start: DisplayDateTimeParts; end?: DisplayDateTimeParts } | null {
  const parenRange = parseParenTimeRange(text)
  if (parenRange) return parenRange

  const parts = splitRangeOutsideParens(text)
  if (parts.length === 1) {
    const start = parseInstantFromSegment(parts[0]!)
    return start ? { start } : null
  }
  if (parts.length < 2) return null

  const left = parseInstantFromSegment(parts[0]!)
  if (!left) return null
  const rightRaw = parts[parts.length - 1]!
  const rightTime = parseTimeOnly(rightRaw)
  if (rightTime) {
    const end = withTime(left, rightTime.hour, rightTime.minute)
    return end ? { start: left.hasTime ? left : { ...left, hour: 0, minute: 0, second: 0, hasTime: true }, end } : null
  }
  const right = parseInstantFromSegment(rightRaw)
  if (!right) return null
  return { start: left, end: right }
}

function stripQualifier(text: string): { body: string; qualifier: string } {
  const match = ALL_DAY_QUALIFIER_RE.exec(text)
  if (!match) return { body: text.trim(), qualifier: '' }
  return { body: text.slice(0, match.index).trim(), qualifier: '종일' }
}

function splitPrefix(text: string): { prefix: string; body: string } {
  const index = text.indexOf(':')
  if (index <= 0) return { prefix: '', body: text }
  const prefix = text.slice(0, index).trim()
  const body = text.slice(index + 1).trim()
  if (!prefix || !body) return { prefix: '', body: text }
  if (isScheduleDateLikeText(prefix) || !isScheduleDateLikeText(body)) {
    return { prefix: '', body: text }
  }
  return { prefix, body }
}

function formatParsedRange(
  start: DisplayDateTimeParts,
  end: DisplayDateTimeParts | undefined,
  dateOnly: boolean,
): string {
  if (!end) {
    return dateOnly || !start.hasTime ? formatDisplayDateParts(start) : formatDateTimeParts(start)
  }
  return formatRangeParts(start, end, dateOnly)
}

function normalizeOneRange(text: string, dateOnly: boolean): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const { prefix, body } = splitPrefix(trimmed)
  const { body: rangeBody, qualifier } = stripQualifier(body)
  const parsed = parseRangeBody(rangeBody)
  if (!parsed) return null
  const formatted = formatParsedRange(parsed.start, parsed.end, dateOnly)
  const withQualifier = qualifier ? `${formatted} ${qualifier}` : formatted
  return prefix ? `${prefix} : ${withQualifier}` : withQualifier
}

export function normalizeScheduleDisplayLabel(
  raw: string | null | undefined,
  options: { dateOnly?: boolean } = {},
): string {
  // 백엔드 자동 기본명(`공통 교육 예정 N`)은 일정 라벨에서 제거한다.
  const trimmed = stripDefaultEducationSlotNameFromLabel(raw)
  if (!trimmed) return ''
  const dateOnly = options.dateOnly === true
  const segments = trimmed.split(/\s*\|\s*/)
  if (segments.length === 1) {
    return normalizeOneRange(trimmed, dateOnly) ?? trimmed
  }

  let parsedCount = 0
  const normalized = segments.map(segment => {
    const next = normalizeOneRange(segment, dateOnly)
    if (next) parsedCount += 1
    return next ?? segment
  })
  if (parsedCount === 0) return trimmed
  return normalized.join(' | ')
}

export function parseScheduleDisplayLabel(raw: string): {
  dateKey?: string
  timeRange?: string
  sessionLabel?: string
} {
  let text = raw.trim()
  if (!text) return {}

  let sessionLabel = ''
  const sessionSuffix = text.match(/\s*\|\s*((?:\d+\s*차시|\d+\s*회차|사전\s*교육).*?)\s*$/i)
  if (sessionSuffix) {
    sessionLabel = sessionSuffix[1]!.trim()
    text = text.slice(0, sessionSuffix.index).trim()
  }

  const parsed = parseRangeBody(stripQualifier(splitPrefix(text).body).body)
  if (!parsed) return sessionLabel ? { sessionLabel } : {}

  const dateKey = `${parsed.start.year}-${String(parsed.start.month).padStart(2, '0')}-${String(parsed.start.day).padStart(2, '0')}`
  const end = parsed.end
  const timeRange =
    parsed.start.hasTime && end?.hasTime
      ? `${formatDisplayClock(parsed.start.hour, parsed.start.minute)} ~ ${formatDisplayClock(end.hour, end.minute)}`
      : parsed.start.hasTime
        ? formatDisplayClock(parsed.start.hour, parsed.start.minute)
        : undefined

  return {
    dateKey,
    ...(timeRange ? { timeRange } : {}),
    ...(sessionLabel ? { sessionLabel } : {}),
  }
}
