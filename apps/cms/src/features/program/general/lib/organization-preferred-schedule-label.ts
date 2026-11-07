/**
 * 기관 희망 일정 표시.
 * 날짜만 있는 일정에 00:00~00:00을 붙이지 않는다.
 */

import {
  appendCurriculumSingleDateFixedScheduleSessionSuffix,
  shouldShowApplicationPreferredScheduleSessionSelect,
} from '@jakorea/form-schema/program-application'
import { stripDefaultEducationSlotNameFromLabel } from '@/shared/lib/education-schedule-name'

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

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** `2026.01.09(금)` */
function formatSeoulDate(clock: SeoulClock): string {
  return `${clock.year}.${pad2(clock.month)}.${pad2(clock.day)}(${clock.weekday})`
}

/** `09:20` */
function formatSeoulClock(clock: SeoulClock): string {
  return `${pad2(clock.hour)}:${pad2(clock.minute)}`
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

type ScheduleDisplayPoint = {
  year: number
  month: number
  day: number
  weekday: string
  hour?: number
  minute?: number
}

const KOREAN_SCHEDULE_POINT =
  /^(?:(\d{4})|(\d{2}))년\s*(\d{1,2})월\s*(\d{1,2})일(?:\s*\(([월화수목금토일])\))?(?:\s+(\d{1,2}):(\d{2}))?$/u
const DOTTED_SCHEDULE_POINT =
  /^(\d{2}|\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})(?:\s*\(([월화수목금토일])\))?(?:\s+(\d{1,2}):(\d{2}))?$/u
const ISO_SCHEDULE_POINT =
  /^(\d{4})-(\d{2})-(\d{2})(?:\(([월화수목금토일])\))?(?:[T\s](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/u
const TIME_ONLY_POINT = /^(\d{1,2}):(\d{2})$/u

function weekdayFromCalendar(year: number, month: number, day: number): string {
  const stamp = new Date(Date.UTC(year, month - 1, day, 3, 0, 0))
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  })
    .format(stamp)
    .replace('요일', '')
}

function parseTimeOnlyPoint(raw: string): { hour: number; minute: number } | null {
  const match = TIME_ONLY_POINT.exec(raw.trim())
  if (!match) return null
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

function schedulePointFromMatch(
  yearRaw: string,
  monthRaw: string,
  dayRaw: string,
  weekdayRaw: string | undefined,
  hourRaw: string | undefined,
  minuteRaw: string | undefined
): ScheduleDisplayPoint {
  const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  return {
    year,
    month,
    day,
    weekday: weekdayRaw || weekdayFromCalendar(year, month, day),
    hour: hourRaw != null ? Number(hourRaw) : undefined,
    minute: minuteRaw != null ? Number(minuteRaw) : undefined,
  }
}

function parseScheduleDisplayPoint(raw: string): ScheduleDisplayPoint | null {
  const text = raw.trim()
  const korean = KOREAN_SCHEDULE_POINT.exec(text)
  if (korean) {
    return schedulePointFromMatch(korean[1] || korean[2] || '', korean[3] || '', korean[4] || '', korean[5], korean[6], korean[7])
  }
  const iso = ISO_SCHEDULE_POINT.exec(text)
  if (iso) {
    const hasExplicitOffset = /(?:Z|[+-]\d{2}:?\d{2})$/u.test(text)
    if (hasExplicitOffset) {
      const clock = readSeoulClock(text)
      if (clock != null && !clock.dateOnlyToken) {
        return {
          year: clock.year,
          month: clock.month,
          day: clock.day,
          weekday: clock.weekday,
          hour: clock.hour,
          minute: clock.minute,
        }
      }
    }
    return schedulePointFromMatch(iso[1] || '', iso[2] || '', iso[3] || '', iso[4], iso[5], iso[6])
  }
  const dotted = DOTTED_SCHEDULE_POINT.exec(text)
  if (!dotted) return null
  return schedulePointFromMatch(dotted[1] || '', dotted[2] || '', dotted[3] || '', dotted[4], dotted[5], dotted[6])
}

function formatScheduleDisplayPointDate(point: ScheduleDisplayPoint): string {
  return `${point.year}.${pad2(point.month)}.${pad2(point.day)}(${point.weekday})`
}

/** `2026년 4월 20일(월)` — 월·일 비패딩 */
function formatScheduleDisplayPointDateKorean(point: ScheduleDisplayPoint): string {
  return `${point.year}년 ${point.month}월 ${point.day}일(${point.weekday})`
}

function formatScheduleDisplayPointTime(point: ScheduleDisplayPoint): string | null {
  if (point.hour == null || point.minute == null) return null
  return `${pad2(point.hour)}:${pad2(point.minute)}`
}

function isMidnightPoint(point: ScheduleDisplayPoint): boolean {
  return point.hour === 0 && point.minute === 0
}

function formatScheduleDisplayRange(
  start: ScheduleDisplayPoint,
  end: ScheduleDisplayPoint | null,
  formatDate: (point: ScheduleDisplayPoint) => string = formatScheduleDisplayPointDate
): string {
  const startDate = formatDate(start)
  const startTime = formatScheduleDisplayPointTime(start)
  if (end == null) {
    if (isMidnightPoint(start)) return startDate
    return startTime ? `${startDate} ${startTime}` : startDate
  }
  const endTime = formatScheduleDisplayPointTime(end)
  const sameDay = start.year === end.year && start.month === end.month && start.day === end.day
  if (sameDay && isMidnightPoint(start) && isMidnightPoint(end)) return startDate
  if (startTime && endTime && sameDay) return `${startDate} ${startTime} ~ ${endTime}`
  if (!startTime && !endTime) {
    return sameDay ? startDate : `${startDate} ~ ${formatDate(end)}`
  }
  const left = startTime ? `${startDate} ${startTime}` : startDate
  const right = endTime && sameDay ? endTime : `${formatDate(end)}${endTime ? ` ${endTime}` : ''}`
  return `${left} ~ ${right}`
}

function formatCmsScheduleLabelWith(
  label: string,
  formatDate: (point: ScheduleDisplayPoint) => string
): string {
  // 백엔드 자동 기본명(`| 공통 교육 예정 N`)은 표시하지 않는다.
  const trimmed = stripDefaultEducationSlotNameFromLabel(label)
  if (!trimmed) return trimmed
  const suffixMatch = /(\s*\|[\s\S]*)$/u.exec(trimmed)
  const suffix = suffixMatch?.[1] ?? ''
  const body = (suffix ? trimmed.slice(0, -suffix.length) : trimmed).trim()
  const sides = body.split(/\s*~\s*/u)
  if (sides.length < 1 || sides.length > 2) return trimmed
  const start = parseScheduleDisplayPoint(sides[0] ?? '')
  if (!start) return trimmed
  let end: ScheduleDisplayPoint | null = null
  if (sides.length === 2) {
    end = parseScheduleDisplayPoint(sides[1] ?? '')
    if (end == null) {
      const timeOnly = parseTimeOnlyPoint(sides[1] ?? '')
      if (timeOnly == null) return trimmed
      end = { ...start, hour: timeOnly.hour, minute: timeOnly.minute }
    }
  }
  return `${formatScheduleDisplayRange(start, end, formatDate)}${suffix}`
}

/**
 * 저장된 한글·점 표기를 화면용 `2026.01.09(금) 09:20`으로만 바꾼다.
 * `| 1차시` 같은 뒤 문구와, 날짜가 아닌 원문은 그대로 둔다.
 */
export function formatCmsScheduleDisplayLabel(label: string): string {
  return formatCmsScheduleLabelWith(label, formatScheduleDisplayPointDate)
}

/** 일정 선택 UI 예외 — `2026년 4월 20일(월) 09:30 ~ 12:20` */
export function formatCmsScheduleKoreanDisplayLabel(label: string): string {
  return formatCmsScheduleLabelWith(label, formatScheduleDisplayPointDateKorean)
}

/** 신청 희망 일정 표시. 시작·종료가 있으면 그 값으로 만들고, 라벨만 있으면 표시용으로만 바꾼다. */
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
      return (stripped ? formatCmsScheduleDisplayLabel(stripped) : '') || fromRange
    }
    return fromRange || (stripped ? formatCmsScheduleDisplayLabel(stripped) : '')
  }
  if (fromRange) return fromRange
  if (label) return formatCmsScheduleDisplayLabel(label)
  return fromRange
}

const SCHEDULE_CARD_DETAIL_TOKEN = /\d+\s*(?:지망|차시|회차)/gu
const SCHEDULE_CARD_DETAIL_KINDS = ['지망', '회차', '차시'] as const

function normalizeScheduleCardDetailToken(value: string): string | null {
  const compact = value.replace(/\s+/g, '')
  const match = /^(\d+)(지망|회차|차시)$/.exec(compact)
  if (!match) return null
  return `${match[1]}${match[2]}`
}

function scheduleCardDetailKind(token: string): number {
  const kind = token.replace(/^\d+/, '')
  const index = SCHEDULE_CARD_DETAIL_KINDS.indexOf(kind as (typeof SCHEDULE_CARD_DETAIL_KINDS)[number])
  return index < 0 ? SCHEDULE_CARD_DETAIL_KINDS.length : index
}

function positiveScheduleCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

/** 승인 모달 카드 첫 줄. `2026.04.20(월) 09:30 ~ 12:20` */
export function formatOrganizationApproveScheduleCardTitle(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  return formatOrganizationScheduleRangeLabel(startAt, endAt)
}

export function extractOrganizationApproveScheduleCardDetail(label: string): string {
  const matches = label.match(SCHEDULE_CARD_DETAIL_TOKEN)
  if (!matches?.length) return ''
  return matches.map(token => token.replace(/\s+/g, '')).join(' | ')
}

function curriculumSingleDateSessionToken(input: {
  educationScheduleMode?: 'date' | 'period' | null
  educationStructure?: 'curriculum' | 'schedule' | null
  sessionRound?: 'single' | 'multi' | null
  curriculumChartSessionCount?: number | null
  curriculumSessions?: readonly { sessionLabel?: string; title?: string }[] | null
  sessionsPerRound?: number | null
  educationRoundCount?: number | null
}): string | null {
  if (input.educationStructure !== 'curriculum' || input.sessionRound !== 'single') return null
  if (input.educationScheduleMode === 'period') return null
  const suffixed = appendCurriculumSingleDateFixedScheduleSessionSuffix(
    '일정',
    {
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
    },
    {
      curriculumChartSessionCount: input.curriculumChartSessionCount ?? undefined,
      curriculumSessions: input.curriculumSessions ?? undefined,
      sessionsPerRound: input.sessionsPerRound ?? undefined,
      educationRoundCount: input.educationRoundCount ?? undefined,
    }
  )
  const match = /\|\s*(\d+)\s*차시\s*$/.exec(suffixed)
  return match ? `${match[1]}차시` : null
}

function mergeOrganizationApproveScheduleCardDetail(
  label: string,
  extraParts: readonly string[]
): string {
  const fromLabel = extractOrganizationApproveScheduleCardDetail(label)
    .split(' | ')
    .map(token => normalizeScheduleCardDetailToken(token))
    .filter((token): token is string => token != null)
  const extras = extraParts
    .map(token => normalizeScheduleCardDetailToken(token))
    .filter((token): token is string => token != null)
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const token of [...fromLabel, ...extras]) {
    if (seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }
  tokens.sort((left, right) => scheduleCardDetailKind(left) - scheduleCardDetailKind(right))
  return tokens.join(' | ')
}

/** 승인 모달 일정 카드. 시각은 첫 줄, 지망·차시·회차는 둘째 줄. */
export function formatOrganizationApproveScheduleCard(input: {
  label?: string | null
  startAt?: string | null
  endAt?: string | null
  /** 기간 지정 희망 순위. 라벨에 없을 때만 둘째 줄에 더한다. */
  preferenceOrder?: number | null
  /** 기간 지정 희망 차시. 라벨에 없을 때만 둘째 줄에 더한다. */
  sessionCount?: number | null
  educationScheduleMode?: 'date' | 'period' | null
  educationStructure?: 'curriculum' | 'schedule' | null
  sessionRound?: 'single' | 'multi' | null
  curriculumChartSessionCount?: number | null
  curriculumSessions?: readonly { sessionLabel?: string; title?: string }[] | null
  sessionsPerRound?: number | null
  educationRoundCount?: number | null
}): { title: string; detail: string } {
  const label = typeof input.label === 'string' ? input.label.trim() : ''
  const titleFromRange = formatOrganizationApproveScheduleCardTitle(input.startAt, input.endAt)
  const showsPreferredSessionSelect = shouldShowApplicationPreferredScheduleSessionSelect({
    educationStructure: input.educationStructure ?? undefined,
    sessionRound: input.sessionRound ?? undefined,
    educationScheduleMode: input.educationScheduleMode ?? undefined,
  })
  const periodWithoutSessionField =
    input.educationScheduleMode === 'period' && !showsPreferredSessionSelect
  const extractedDetail = extractOrganizationApproveScheduleCardDetail(label)
  const labelDetail = periodWithoutSessionField
    ? extractedDetail
        .split(' | ')
        .filter(token => !token.endsWith('차시'))
        .join(' | ')
    : extractedDetail
  const extraParts: string[] = []
  if (input.educationScheduleMode === 'period') {
    const preferenceOrder = positiveScheduleCount(input.preferenceOrder)
    const sessionCount = positiveScheduleCount(input.sessionCount)
    if (preferenceOrder != null && !labelDetail.includes('지망')) {
      extraParts.push(`${preferenceOrder}지망`)
    }
    if (showsPreferredSessionSelect && sessionCount != null && !labelDetail.includes('차시')) {
      extraParts.push(`${sessionCount}차시`)
    }
  }
  const curriculumSession = curriculumSingleDateSessionToken(input)
  if (curriculumSession && !labelDetail.includes('차시')) extraParts.push(curriculumSession)
  const detail = mergeOrganizationApproveScheduleCardDetail(labelDetail, extraParts)
  if (titleFromRange) return { title: titleFromRange, detail }
  const stripped = label
    .replace(SCHEDULE_CARD_DETAIL_TOKEN, '')
    .replace(/[|·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const title = formatCmsScheduleDisplayLabel(stripped || label)
  if (!detail) return { title, detail: '' }
  return { title: title || label, detail: title ? detail : '' }
}
