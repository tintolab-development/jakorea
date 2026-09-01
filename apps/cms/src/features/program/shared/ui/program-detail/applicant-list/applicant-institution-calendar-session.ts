import dayjs from 'dayjs'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

function padHourMinute(hour: string, minute: string): string {
  return `${String(Number.parseInt(hour, 10)).padStart(2, '0')}:${minute}`
}

function parseSessionTimeRange(timeRange: string): {
  startMinutes: number
  endMinutes: number
  display: string
} | null {
  const compact = timeRange.replace(/\s/g, '')
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

function tryResolveInstitutionSessionRound(session: ParticipatingSchoolSession): string | null {
  if (session.round != null && session.round > 0) {
    return `${session.round}차시`
  }
  const classRoundMatch = session.classNum.match(/(\d+)\s*차시/)
  if (classRoundMatch) {
    return `${classRoundMatch[1]}차시`
  }
  if (session.classNum.trim().endsWith('차시')) {
    return session.classNum.trim().replace(/\s+/g, '')
  }
  return null
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
  return sessions.filter(session => {
    const date = parseSessionDate(session.date)
    return date.isValid() && date.format('YYYY-MM-DD') === dateKey
  })
}

/**
 * 캘린더 카드·호버 팝오버 — 강의 진행 시간
 * - 차시/회차 있음: `2차시 (09:20 ~ 11:20)`
 * - 차시/회차 없음: `09:20 ~ 11:20`
 */
export function formatInstitutionCalendarSessionTimeDisplay(
  session: ParticipatingSchoolSession | undefined,
  fallbackPeriod?: string
): string {
  if (session) {
    const timeDisplay = parseSessionTimeDisplay(session.timeRange)
    const roundLabel = tryResolveInstitutionSessionRound(session)
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

export function formatInstitutionCalendarSessionsTimeDisplay(
  sessions: ParticipatingSchoolSession[],
  fallbackPeriod?: string
): string {
  if (sessions.length > 0) {
    if (sessions.length === 1) {
      return formatInstitutionCalendarSessionTimeDisplay(sessions[0], fallbackPeriod)
    }

    const timeRanges = sessions
      .map(session => parseSessionTimeRange(session.timeRange))
      .filter((range): range is NonNullable<typeof range> => range != null)

    const roundLabel = `${sessions.length}차시`
    if (timeRanges.length === 0) return roundLabel

    const startMinutes = Math.min(...timeRanges.map(range => range.startMinutes))
    const endMinutes = Math.max(...timeRanges.map(range => range.endMinutes))
    return `${roundLabel} (${formatMinutesAsHourMinute(startMinutes)} ~ ${formatMinutesAsHourMinute(endMinutes)})`
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
