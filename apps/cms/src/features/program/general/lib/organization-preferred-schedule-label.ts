/**
 * 기관 희망 일정 표시.
 * 날짜만 있는 일정에 00:00~00:00을 붙이지 않는다.
 */

type SeoulClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: string
  dateOnlyToken: boolean
}

const SYNTHETIC_MIDNIGHT_LABEL = /(?:^|\s)0?0:00\s*[~\-–]\s*0?0:00\s*$/u

function readPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find(part => part.type === type)?.value ?? ''
}

function readSeoulClock(value: string): SeoulClock | null {
  const trimmed = value.trim()
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (dateOnly) {
    const stamp = new Date(`${trimmed}T12:00:00+09:00`)
    if (Number.isNaN(stamp.getTime())) return null
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).formatToParts(stamp)
    const weekday = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      weekday: 'short',
    })
      .format(stamp)
      .replace('요일', '')
    return {
      year: Number(readPart(parts, 'year')),
      month: Number(readPart(parts, 'month')),
      day: Number(readPart(parts, 'day')),
      hour: 0,
      minute: 0,
      weekday,
      dateOnlyToken: true,
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return null
  const parsed = Date.parse(trimmed)
  if (!Number.isFinite(parsed)) return null
  const stamp = new Date(parsed)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(stamp)
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  })
    .format(stamp)
    .replace('요일', '')
  let hour = Number(readPart(parts, 'hour'))
  if (hour === 24) hour = 0
  return {
    year: Number(readPart(parts, 'year')),
    month: Number(readPart(parts, 'month')),
    day: Number(readPart(parts, 'day')),
    hour,
    minute: Number(readPart(parts, 'minute')),
    weekday,
    dateOnlyToken: false,
  }
}

function isMidnightClock(clock: SeoulClock): boolean {
  return clock.hour === 0 && clock.minute === 0
}

function seoulDateKey(clock: SeoulClock): string {
  return `${clock.year}-${clock.month}-${clock.day}`
}

function formatSeoulDate(clock: SeoulClock): string {
  const year = clock.year % 100
  return `${year}년 ${clock.month}월 ${clock.day}일(${clock.weekday})`
}

function formatSeoulClock(clock: SeoulClock): string {
  return `${clock.hour}:${String(clock.minute).padStart(2, '0')}`
}

function addSeoulDays(clock: SeoulClock, days: number): string {
  const stamp = new Date(Date.UTC(clock.year, clock.month - 1, clock.day + days))
  return `${stamp.getUTCFullYear()}-${stamp.getUTCMonth() + 1}-${stamp.getUTCDate()}`
}

/**
 * 날짜만 있는 희망 일정. 자정~자정을 수업 시간으로 보지 않는다.
 * 시작·종료가 모두 00:00이거나, 시각 없는 `YYYY-MM-DD`이면 날짜만으로 본다.
 */
export function isOrganizationPreferredDateOnlyRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): boolean {
  const start = typeof startAt === 'string' ? readSeoulClock(startAt) : null
  const end = typeof endAt === 'string' ? readSeoulClock(endAt) : null
  if (start == null && end == null) return false
  if (start != null && end == null) return start.dateOnlyToken || isMidnightClock(start)
  if (start == null && end != null) return end.dateOnlyToken || isMidnightClock(end)
  return (
    start != null &&
    end != null &&
    (start.dateOnlyToken || isMidnightClock(start)) &&
    (end.dateOnlyToken || isMidnightClock(end))
  )
}

export function formatOrganizationScheduleRangeLabel(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  const start = typeof startAt === 'string' ? readSeoulClock(startAt) : null
  const end = typeof endAt === 'string' ? readSeoulClock(endAt) : null
  if (start == null && end == null) return ''
  if (start != null && (end == null || isOrganizationPreferredDateOnlyRange(startAt, endAt))) {
    if (end != null && isOrganizationPreferredDateOnlyRange(startAt, endAt)) {
      const sameDay = seoulDateKey(start) === seoulDateKey(end)
      const nextDay = seoulDateKey(end) === addSeoulDays(start, 1)
      if (!sameDay && !nextDay) {
        return `${formatSeoulDate(start)} ~ ${formatSeoulDate(end)}`
      }
    }
    return formatSeoulDate(start)
  }
  if (start == null || end == null) return ''
  const sameDay = seoulDateKey(start) === seoulDateKey(end)
  if (sameDay) {
    return `${formatSeoulDate(start)} ${formatSeoulClock(start)} ~ ${formatSeoulClock(end)}`
  }
  return `${formatSeoulDate(start)} ${formatSeoulClock(start)} ~ ${formatSeoulDate(end)} ${formatSeoulClock(end)}`
}

/** 신청 희망 일정 표시. label이 있으면 원문을 쓰고, 자정 placeholder 시각은 붙이지 않는다. */
export function formatOrganizationPreferredScheduleLabel(schedule: {
  label?: string | null
  startAt?: string | null
  endAt?: string | null
}): string {
  const label = typeof schedule.label === 'string' ? schedule.label.trim() : ''
  const fromRange = formatOrganizationScheduleRangeLabel(schedule.startAt, schedule.endAt)
  if (label && SYNTHETIC_MIDNIGHT_LABEL.test(label)) {
    const stripped = label.replace(SYNTHETIC_MIDNIGHT_LABEL, '').trim()
    if (isOrganizationPreferredDateOnlyRange(schedule.startAt, schedule.endAt) || !fromRange) {
      return stripped || fromRange
    }
    return fromRange || stripped
  }
  if (label) return label
  return fromRange
}
