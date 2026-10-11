import { mapPreferredEducationSchedulesToSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

/**
 * 강사·봉사 배정 후보 일정 (B).
 * participant/OSA `sessions`와 혼용하지 않는다 — 참여 기관 테이블·출석 등은 `school.sessions` 직접 유지.
 */
export function getParticipatingSchoolAssignmentSessions(
  school: Pick<ParticipatingSchoolRow, 'preferredEducationSchedules' | 'sessions'>
): ParticipatingSchoolSession[] {
  const fromPreferred = mapPreferredEducationSchedulesToSessions(
    school.preferredEducationSchedules
  )
  if (fromPreferred.length > 0) {
    return fromPreferred.filter(session => session.status !== 'not_planned')
  }
  return (school.sessions ?? []).filter(session => session.status !== 'not_planned')
}
