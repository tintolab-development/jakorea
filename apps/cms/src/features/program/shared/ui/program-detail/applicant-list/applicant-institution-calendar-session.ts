import dayjs from 'dayjs'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'

function parseSessionDate(dateStr: string): dayjs.Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 캘린더 카드 2행 — 지역 짧은 표기 (첫 토큰) */
export function getInstitutionRegionShort(region: string | undefined): string {
  const trimmed = String(region ?? '').trim()
  if (!trimmed) return '-'
  return trimmed.split(/\s+/)[0] ?? '-'
}

export function findInstitutionSessionForDate(
  row: ApplicantSchoolRow,
  dateKey: string
): ParticipatingSchoolSession | undefined {
  const sessions = row.sessions?.filter(s => s.status !== 'not_planned') ?? []
  return sessions.find(session => {
    const date = parseSessionDate(session.date)
    return date.isValid() && date.format('YYYY-MM-DD') === dateKey
  })
}

function resolveRoundLabel(session: ParticipatingSchoolSession): string {
  if (session.round != null) return `${session.round}차시`
  const classMatch = session.classNum.match(/\d+\s*차시/)
  if (classMatch) return classMatch[0].replace(/\s+/g, '')
  const digits = Number.parseInt(session.classNum.replace(/\D/g, ''), 10)
  return `${Number.isFinite(digits) && digits > 0 ? digits : 1}차시`
}

/** 캘린더 우측 카드 2행 — `2차시 (09:20 ~ 11:20)` 형식 */
export function getInstitutionCalendarSessionCardLabel(
  session: ParticipatingSchoolSession | undefined,
  fallbackPeriod?: string
): string {
  if (session) {
    const roundLabel = resolveRoundLabel(session)
    const timeMatch = session.timeRange.match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    if (timeMatch) {
      return `${roundLabel} (${timeMatch[1]} ~ ${timeMatch[2]})`
    }
    return roundLabel
  }
  if (fallbackPeriod) {
    const timeMatch = fallbackPeriod.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/)
    if (timeMatch) return `1차시 (${timeMatch[1]} ~ ${timeMatch[2]})`
  }
  return '-'
}
