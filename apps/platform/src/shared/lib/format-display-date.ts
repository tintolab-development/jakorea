/** Platform 기간·일정 표시 SSOT. 게시일·입력값 포맷과 분리한다. */

export const DISPLAY_DATE_TIMEZONE = 'Asia/Seoul'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const SEOUL_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_DATE_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

const ISO_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DATETIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/
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
  hasTime: boolean
}

export type FormatDisplayRangeOptions = {
  empty?: string
  dateOnly?: boolean
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
  if (!isValidYmd(year, month, day)) return null
  return {
    year,
    month,
    day,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
    hasTime,
  }
}

function calendarParts(year: number, month: number, day: number): DisplayDateTimeParts | null {
  if (!isValidYmd(year, month, day)) return null
  return { year, month, day, hour: 0, minute: 0, hasTime: false }
}

function withTime(
  parts: DisplayDateTimeParts,
  hour: number,
  minute: number,
): DisplayDateTimeParts | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  return { ...parts, hour, minute, hasTime: true }
}

export function formatDisplayClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDisplayClockLabel(raw: string): string {
  const match = TIME_ONLY_RE.exec(raw.trim()) ?? CLOCK_RE.exec(raw.trim())
  if (!match) return raw.trim()
  return formatDisplayClock(Number(match[1]), Number(match[2]))
}

export function formatDisplayDateParts(parts: Pick<DisplayDateTimeParts, 'year' | 'month' | 'day'>): string {
  const weekday = weekdayKo(parts.year, parts.month, parts.day)
  return `${parts.year}년 ${parts.month}월 ${parts.day}일(${weekday})`
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
    return mode === 'date' ? { ...fromLabel, hasTime: false, hour: 0, minute: 0 } : fromLabel
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
  return parts ? formatDateTimeParts(parts) : ''
}

export function formatDisplayDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  options: FormatDisplayRangeOptions = {},
): string {
  const empty = options.empty ?? '-'
  const startParts = start == null || start === '' ? null : parseSource(start, 'date')
  const endParts = end == null || end === '' ? null : parseSource(end, 'date')
  if (!startParts && !endParts) return empty
  if (startParts && !endParts) return formatDisplayDateParts(startParts)
  if (!startParts && endParts) return formatDisplayDateParts(endParts)
  if (sameCalendarDay(startParts!, endParts!)) return formatDisplayDateParts(startParts!)
  return `${formatDisplayDateParts(startParts!)} ~ ${formatDisplayDateParts(endParts!)}`
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
  if (startParts && !endParts) return formatDateTimeParts(startParts)
  if (!startParts && endParts) return formatDateTimeParts(endParts)
  return formatRangeParts(startParts!, endParts!, options.dateOnly === true)
}

function formatRangeParts(
  start: DisplayDateTimeParts,
  end: DisplayDateTimeParts,
  dateOnly: boolean,
): string {
  if (dateOnly || (!start.hasTime && !end.hasTime)) {
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
  return { year: 1970, month: 1, day: 1, hour: clock.hour, minute: clock.minute, hasTime: true }
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
    return end ? { start: left.hasTime ? left : { ...left, hour: 0, minute: 0, hasTime: true }, end } : null
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
  const trimmed = raw?.trim() ?? ''
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
