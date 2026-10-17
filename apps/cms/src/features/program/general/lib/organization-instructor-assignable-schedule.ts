import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

export type OrganizationInstructorAssignmentSchedulePayload = {
  scheduleId?: number
  requestedScheduleId?: number
}

/** BE가 인정하는 기관-일정 조합: resolved scheduleId 또는 requestedScheduleId */
export function resolveAssignableSchedulePayloadFromSession(
  session: ParticipatingSchoolSession | null | undefined,
): OrganizationInstructorAssignmentSchedulePayload | null {
  if (!session || session.scheduleUnresolved) return null
  const scheduleId = session.resolvedScheduleId
  if (scheduleId != null && Number.isFinite(scheduleId) && scheduleId > 0) {
    return { scheduleId: Math.trunc(scheduleId) }
  }
  const requestedScheduleId = session.requestedScheduleId
  if (
    requestedScheduleId != null &&
    Number.isFinite(requestedScheduleId) &&
    requestedScheduleId > 0
  ) {
    return { requestedScheduleId: Math.trunc(requestedScheduleId) }
  }
  return null
}

export function listAssignableSchedulePayloadsFromSessions(
  sessions: readonly ParticipatingSchoolSession[] | null | undefined,
): OrganizationInstructorAssignmentSchedulePayload[] {
  if (!sessions?.length) return []
  const payloads: OrganizationInstructorAssignmentSchedulePayload[] = []
  for (const session of sessions) {
    const payload = resolveAssignableSchedulePayloadFromSession(session)
    if (payload) payloads.push(payload)
  }
  return payloads
}

export function hasAssignableOrganizationInstructorSchedule(
  sessions: readonly ParticipatingSchoolSession[] | null | undefined,
): boolean {
  return listAssignableSchedulePayloadsFromSessions(sessions).length > 0
}
