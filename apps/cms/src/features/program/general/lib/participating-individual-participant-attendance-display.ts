import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import type { Program } from '@/types/domain'

/** 출석 내역 테이블 — `2026. 04. 03(금) | 오리엔테이션` */
export function formatParticipatingIndividualParticipantAttendanceScheduleLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const dateLabel = formatCmsScheduleDisplayLabel(
    session.dayOfWeek ? `${session.date}(${session.dayOfWeek})` : session.date
  )
  const scheduleName = resolveParticipatingInstitutionScheduleRowLabel(program, session)
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
