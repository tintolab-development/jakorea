import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import type { Program } from '@/types/domain'

/** 출석 내역 테이블 — `26년 4월 3일 (금) | 오리엔테이션` */
export function formatParticipatingIndividualParticipantAttendanceScheduleLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const datePart = session.date
    .replace(/^(\d{4})\./, (_, year) => `${String(year).slice(-2)}년 `)
    .replace(/\./g, ' ')
    .trim()
  const dayPart = session.dayOfWeek ? ` (${session.dayOfWeek})` : ''
  const scheduleName = resolveParticipatingInstitutionScheduleRowLabel(program, session)
  const dateLabel = `${datePart}${dayPart}`
  if (scheduleName === '교육 일정') return dateLabel
  return `${dateLabel} | ${scheduleName}`
}

export function formatParticipatingIndividualParticipantAttendanceShortDateLabel(
  scheduleLabel: string
): string {
  const pipeIndex = scheduleLabel.indexOf('|')
  const datePart = (pipeIndex >= 0 ? scheduleLabel.slice(0, pipeIndex) : scheduleLabel).trim()
  const monthDayMatch = datePart.match(/(\d{2})년\s+(\d{1,2})월\s+(\d{1,2})일/)
  if (!monthDayMatch) return datePart
  return `${Number(monthDayMatch[2])}월 ${Number(monthDayMatch[3])}일`
}
