import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

/** 확정 일정: program_schedule에 매핑된(resolvedScheduleId) 일정만 배정 후보로 쓴다. */
function isConfirmedAssignmentSession(session: ParticipatingSchoolSession): boolean {
  if (session.status === 'not_planned') return false
  if (session.scheduleUnresolved) return false
  const scheduleId = session.resolvedScheduleId
  return scheduleId != null && Number.isFinite(scheduleId) && scheduleId > 0
}

/**
 * 강사·봉사 배정 후보 일정.
 * 참여자 API `sessions[]`의 확정 일정만 쓴다. 희망 일정(`preferredEducationSchedules`)은
 * 표시 전용이므로 배정 후보로 쓰지 않고, 미확정(`scheduleUnresolved`) 일정은 뺀다.
 */
export function getParticipatingSchoolAssignmentSessions(
  school: Pick<ParticipatingSchoolRow, 'sessions'>
): ParticipatingSchoolSession[] {
  return (school.sessions ?? []).filter(isConfirmedAssignmentSession)
}
