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

/** 일반 기관 — 희망 일정이 실제 일정으로 확정되지 않아 강사를 배정할 수 없을 때 */
export const ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE =
  '기관의 희망 일정이 아직 확정되지 않아 강사를 배정할 수 없습니다. 「희망 일정 확정」으로 일정을 먼저 확정해 주세요.'

export type OrganizationInstructorAssignmentScheduleTargetInput = {
  /**
   * 1사1교만 true. requestedScheduleId 단독 배정은 BE에서 1사1교 일정 생성 로직을 타므로
   * 일반 기관(GENERAL_ORGANIZATION)에는 쓰지 않는다.
   */
  allowRequestedScheduleOnly: boolean
  /** assignment board 일정과 시간까지 맞춘 scheduleId */
  boardScheduleId?: number | null
  /** requested-schedules 행이 연결된 실제 일정(승인·희망 일정 확정으로 생성) */
  resolvedScheduleId?: number | null
  requestedScheduleId?: number | null
}

function positiveId(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : null
}

/**
 * 강사 배정 생성 body의 일정 필드. 배정할 수 없으면 null.
 * - 일반 기관: scheduleId(board 매칭 또는 resolvedScheduleId) 필수. requestedScheduleId는 scheduleId와 함께일 때만 보낸다.
 * - 1사1교: scheduleId가 없으면 requestedScheduleId 단독도 허용(기존 동작).
 */
export function resolveOrganizationInstructorAssignmentScheduleTarget(
  input: OrganizationInstructorAssignmentScheduleTargetInput
): OrganizationInstructorAssignmentSchedulePayload | null {
  const scheduleId = positiveId(input.boardScheduleId) ?? positiveId(input.resolvedScheduleId)
  const requestedScheduleId = positiveId(input.requestedScheduleId)
  if (scheduleId != null) {
    return {
      scheduleId,
      ...(requestedScheduleId != null ? { requestedScheduleId } : {}),
    }
  }
  if (input.allowRequestedScheduleOnly && requestedScheduleId != null) {
    return { requestedScheduleId }
  }
  return null
}
