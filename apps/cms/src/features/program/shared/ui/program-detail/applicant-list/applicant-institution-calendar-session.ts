import dayjs from 'dayjs'
import {
  parseConfirmedCurriculumSessionCount,
  stripDefaultEducationSlotNameFromLabel,
} from '@/shared/lib/education-schedule-name'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  resolveGeneralProgramScheduleStructure,
  resolveGeneralScheduleUnitLabel,
} from '@/features/program/general/lib/schedule-unit-label'
import { toCalendarScheduleLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import type { Program } from '@/types/domain'
import { dateRangeUsesClockTime } from '@/features/template/lib/date-range-clock'
import { parseEducationScheduleLineToRange } from '@/features/template/lib/format-education-schedule-line'

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

function padHourMinute(hour: string, minute: string): string {
  return `${String(Number.parseInt(hour, 10)).padStart(2, '0')}:${minute}`
}

function parseSessionTimeRange(timeRange: string | undefined | null): {
  startMinutes: number
  endMinutes: number
  display: string
} | null {
  const raw = timeRange?.trim()
  if (!raw || raw === '-') return null
  const compact = raw.replace(/\s/g, '')
  const match = /^(\d{1,2}):(\d{2})[~\-–—]+(\d{1,2}):(\d{2})$/.exec(compact)
  if (!match) return null
  const startHour = Number.parseInt(match[1], 10)
  const startMinute = Number.parseInt(match[2], 10)
  const endHour = Number.parseInt(match[3], 10)
  const endMinute = Number.parseInt(match[4], 10)
  return {
    startMinutes: startHour * 60 + startMinute,
    endMinutes: endHour * 60 + endMinute,
    display: `${padHourMinute(match[1], match[2])} ~ ${padHourMinute(match[3], match[4])}`,
  }
}

function parseSessionTimeDisplay(timeRange: string): string | null {
  return parseSessionTimeRange(timeRange)?.display ?? null
}

function formatMinutesAsHourMinute(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/**
 * 1사1교·Gemini 희망 행(`classNum` = `N교시`, map-requested-schedules) — 기존 표기를 그대로 둔다.
 * 일반 프로그램에는 교시가 없다.
 */
function isPeriodClassSession(session: ParticipatingSchoolSession): boolean {
  return /\d+\s*교시$/u.test(session.classNum?.trim() ?? '')
}

function legacyPeriodClassSessionLabel(session: ParticipatingSchoolSession): string | null {
  return session.round != null && session.round > 0 ? `${session.round}회차` : null
}

/** 신청 행에 적힌 차시 '개수'(`classNum`·`duration`의 `N차시`). 회차·지망·순번으로 만들지 않는다. */
function readExplicitSessionCount(session: ParticipatingSchoolSession): number | null {
  return (
    parseConfirmedCurriculumSessionCount(session.classNum) ??
    parseConfirmedCurriculumSessionCount(session.duration)
  )
}

/**
 * 캘린더 일정 선행 라벨.
 * - 일반 프로그램 `program`이 있으면 교육 구조별 라벨({@link resolveGeneralScheduleUnitLabel} —
 *   일정형=세부 일정명, 단일 회차=N차시, 복수 회차=N회차). 1사1교 등은 아래 기존 규칙
 * - 없으면 신청 행에 적힌 차시 수만. `round`(지망 순위·순번)를 회차로 쓰지 않는다. 모르면 null(시간만)
 */
function resolveGeneralSessionLead(
  session: ParticipatingSchoolSession,
  program?: Program | null
): string | null {
  return toCalendarScheduleLeadLabel(
    resolveGeneralScheduleUnitLabel(
      {
        sessionNo: session.sessionNo,
        curriculumSessionCount: session.curriculumSessionCount,
        scheduleRole: session.scheduleRole,
        educationSlotKey: session.educationSlotKey,
        scheduleName: session.scheduleName ?? session.educationScheduleLabel,
      },
      program
    )
  ) ?? null
}

function tryResolveInstitutionSessionRound(
  session: ParticipatingSchoolSession,
  program?: Program | null
): string | null {
  if (isPeriodClassSession(session)) return legacyPeriodClassSessionLabel(session)
  const generalLead = resolveGeneralSessionLead(session, program)
  if (generalLead) return generalLead
  const count = readExplicitSessionCount(session)
  return count != null ? `${count}차시` : null
}

export type SessionCalendarClockTimes = { startTime: string; endTime: string }

function padClockToken(raw: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
  if (!match) return raw.trim()
  return padHourMinute(match[1], match[2])
}

function isAllDayClockSentinel(startTime: string, endTime: string): boolean {
  if (startTime !== '00:00') return false
  return endTime === '00:00' || endTime === '23:59' || endTime === '24:00'
}

/** `09:20 ~ 11:10`, `3차시 (03:55 ~ 04:50)` 등 문자열에서 HH:mm 구간 추출 */
function extractClockRangeFromText(
  text: string | undefined | null
): SessionCalendarClockTimes | null {
  const raw = text?.trim()
  if (!raw || raw === '-') return null
  const match = raw.match(/(\d{1,2}:\d{2})\s*[~\-–—]\s*(\d{1,2}:\d{2})/)
  if (!match) return null
  const startTime = padClockToken(match[1])
  const endTime = padClockToken(match[2])
  if (isAllDayClockSentinel(startTime, endTime)) return null
  return { startTime, endTime }
}

function clocksFromScheduleLine(
  line: string | undefined | null
): SessionCalendarClockTimes | null {
  const range = parseEducationScheduleLineToRange(line ?? '')
  if (!range) return extractClockRangeFromText(line)
  const [start, end] = range
  if (!dateRangeUsesClockTime(start, end)) return extractClockRangeFromText(line)
  return {
    startTime: start.format('HH:mm'),
    endTime: end.format('HH:mm'),
  }
}

/**
 * 주간 격자용 HH:mm.
 * timeRange → scheduleLabel → date(라벨형) 순으로 실제 시각만 반환. 종일·날짜 전용은 null.
 */
export function resolveSessionCalendarClockTimes(
  session: ParticipatingSchoolSession
): SessionCalendarClockTimes | null {
  return (
    extractClockRangeFromText(session.timeRange) ??
    clocksFromScheduleLine(session.scheduleLabel) ??
    clocksFromScheduleLine(session.date)
  )
}

/** 세션 `date` 또는 `scheduleLabel`(label-only API)에서 캘린더용 YYYY-MM-DD */
export function resolveSessionCalendarDateKey(
  session: ParticipatingSchoolSession
): string | null {
  const trimmedDate = session.date?.trim()
  if (trimmedDate && trimmedDate !== '-') {
    const parsed = parseSessionDate(trimmedDate)
    if (parsed.isValid()) return parsed.format('YYYY-MM-DD')
    const fromDateLine = parseEducationScheduleLineToRange(trimmedDate)
    if (fromDateLine) return fromDateLine[0].format('YYYY-MM-DD')
  }
  const label = session.scheduleLabel?.trim()
  if (!label) return null
  const range = parseEducationScheduleLineToRange(label)
  if (!range) return null
  return range[0].format('YYYY-MM-DD')
}

export function resolveSessionCalendarIsoRange(
  session: ParticipatingSchoolSession
): { dateKey: string; startDate: string; endDate: string } | null {
  const dateKey = resolveSessionCalendarDateKey(session)
  if (!dateKey) return null

  const clocks = resolveSessionCalendarClockTimes(session)
  if (clocks) {
    const endIsoClock = clocks.endTime === '24:00' ? '23:59:59' : `${clocks.endTime}:00`
    return {
      dateKey,
      startDate: `${dateKey}T${clocks.startTime}:00`,
      endDate: `${dateKey}T${endIsoClock}`,
    }
  }

  return {
    dateKey,
    startDate: `${dateKey}T00:00:00`,
    endDate: `${dateKey}T23:59:59`,
  }
}

/** 캘린더 카드 2행 — 지역 짧은 표기 (첫 토큰) */
export function getInstitutionRegionShort(region: string | undefined): string {
  const trimmed = String(region ?? '').trim()
  if (!trimmed) return '-'
  return trimmed.split(/\s+/)[0] ?? '-'
}

export function findInstitutionSessionForDate(
  row: { sessions?: ParticipatingSchoolSession[] },
  dateKey: string
): ParticipatingSchoolSession | undefined {
  return findInstitutionSessionsForDate(row, dateKey)[0]
}

export function findInstitutionSessionsForDate(
  row: { sessions?: ParticipatingSchoolSession[] },
  dateKey: string
): ParticipatingSchoolSession[] {
  const sessions = row.sessions?.filter(s => s.status !== 'not_planned') ?? []
  return sessions.filter(session => resolveSessionCalendarDateKey(session) === dateKey)
}

/**
 * 캘린더 카드·호버 팝오버 — 강의 진행 시간
 * - 선행 라벨(차시 수·회차·세부 일정명) 있음: `2차시 (09:20 ~ 11:20)`
 * - 없음: `09:20 ~ 11:20`
 */
export function formatInstitutionCalendarSessionTimeDisplay(
  session: ParticipatingSchoolSession | undefined,
  fallbackPeriod?: string,
  program?: Program | null
): string {
  if (session) {
    const label = stripDefaultEducationSlotNameFromLabel(session.scheduleLabel)
    if (label) return label
    const timeDisplay = parseSessionTimeDisplay(session.timeRange)
    const roundLabel = tryResolveInstitutionSessionRound(session, program)
    if (roundLabel && timeDisplay) return `${roundLabel} (${timeDisplay})`
    if (roundLabel) return roundLabel
    if (timeDisplay) return timeDisplay
    return '-'
  }
  if (fallbackPeriod) {
    const timeMatch = fallbackPeriod.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      return `${padHourMinute(timeMatch[1], timeMatch[2])} ~ ${padHourMinute(timeMatch[3], timeMatch[4])}`
    }
  }
  return '-'
}

/** 호버·팝오버 — 동일 날 복수 세션 시간을 `10:20 ~ 11:20, 14:20 ~ 16:20` 형태로 */
export function formatInstitutionCalendarSessionTimesCommaList(
  sessions: ParticipatingSchoolSession[],
  fallbackPeriod?: string,
  program?: Program | null
): string {
  if (sessions.length === 0) {
    return formatInstitutionCalendarSessionTimeDisplay(undefined, fallbackPeriod)
  }

  const labels = sessions
    .map(session => {
      const timeOnly = parseSessionTimeDisplay(session.timeRange)
      if (timeOnly) return timeOnly
      const label = stripDefaultEducationSlotNameFromLabel(session.scheduleLabel)
      if (label) return label
      const roundLabel = tryResolveInstitutionSessionRound(session, program)
      if (roundLabel) return roundLabel
      return formatInstitutionCalendarSessionTimeDisplay(session, undefined, program)
    })
    .filter((label): label is string => Boolean(label && label !== '-'))

  if (labels.length === 0) return '-'
  return labels.join(', ')
}

export function formatInstitutionCalendarHoverMetaLine(
  institution: { region?: string; educationGrade?: string },
  sessions: ParticipatingSchoolSession[],
  fallbackPeriod?: string,
  program?: Program | null
): string {
  const region = getInstitutionRegionShort(institution.region)
  const grade = institution.educationGrade?.trim() || '-'
  const times = formatInstitutionCalendarSessionTimesCommaList(sessions, fallbackPeriod, program)
  const parts = [region, grade]
  if (times && times !== '-') {
    parts.push(times)
  }
  return parts.join(' | ')
}

/**
 * 같은 날 일정이 여러 건일 때의 선행 라벨. 일정 '건수'를 차시로 쓰지 않는다.
 * - 1사1교·Gemini 교시 행: 기존 표기(`N차시` = 행 수)
 * - 일반 프로그램 `program`이면 일정별 교육 구조 라벨(중복 제거)을 `, `로 잇는다
 * - 없으면 모든 행에 차시 수가 적혀 있을 때만 그 합 `N차시`, 아니면 null(시간만)
 */
function resolveSameDaySessionsLeadLabel(
  sessions: ParticipatingSchoolSession[],
  program?: Program | null
): string | null {
  if (sessions.every(isPeriodClassSession)) return `${sessions.length}차시`
  if (resolveGeneralProgramScheduleStructure(program) != null) {
    const leads = [
      ...new Set(
        sessions
          .map(session => resolveGeneralSessionLead(session, program))
          .filter((lead): lead is string => Boolean(lead))
      ),
    ]
    if (leads.length > 0) return leads.join(', ')
  }
  const counts = sessions.map(readExplicitSessionCount)
  if (counts.every((count): count is number => count != null)) {
    return `${counts.reduce((sum, count) => sum + count, 0)}차시`
  }
  return null
}

export function formatInstitutionCalendarSessionsTimeDisplay(
  sessions: ParticipatingSchoolSession[],
  fallbackPeriod?: string,
  program?: Program | null
): string {
  if (sessions.length > 0) {
    if (sessions.length === 1) {
      return formatInstitutionCalendarSessionTimeDisplay(sessions[0], fallbackPeriod, program)
    }

    const timeRanges = sessions
      .map(session => parseSessionTimeRange(session.timeRange))
      .filter((range): range is NonNullable<typeof range> => range != null)

    const leadLabel = resolveSameDaySessionsLeadLabel(sessions, program)
    if (timeRanges.length === 0) {
      return leadLabel ?? formatInstitutionCalendarSessionTimeDisplay(undefined, fallbackPeriod)
    }

    const startMinutes = Math.min(...timeRanges.map(range => range.startMinutes))
    const endMinutes = Math.max(...timeRanges.map(range => range.endMinutes))
    const span = `${formatMinutesAsHourMinute(startMinutes)} ~ ${formatMinutesAsHourMinute(endMinutes)}`
    return leadLabel ? `${leadLabel} (${span})` : span
  }

  return formatInstitutionCalendarSessionTimeDisplay(undefined, fallbackPeriod)
}

/** @deprecated alias — `formatInstitutionCalendarSessionTimeDisplay` 사용 */
export function getInstitutionCalendarSessionCardLabel(
  session: ParticipatingSchoolSession | undefined,
  fallbackPeriod?: string
): string {
  return formatInstitutionCalendarSessionTimeDisplay(session, fallbackPeriod)
}
