import { mapSessionProgressToParticipatingSchoolSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveParticipatingProgressAssignedSessions } from '@/features/program/general/lib/organization-education-schedule-sources'
import { resolveEducationProgressFromScheduleBounds } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import type { SessionProgressScheduleRole } from '@/shared/api/generated/dashboard/schemas/sessionProgressScheduleRole'
import type { SessionProgressScheduleStatus } from '@/shared/api/generated/dashboard/schemas/sessionProgressScheduleStatus'

function positiveScheduleId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function participantSessionsByScheduleId(
  sessions: ReadonlyArray<ParticipatingSchoolSession> | undefined
): Map<number, ParticipatingSchoolSession> {
  const map = new Map<number, ParticipatingSchoolSession>()
  for (const session of sessions ?? []) {
    const scheduleId = positiveScheduleId(session.resolvedScheduleId)
    if (scheduleId == null) continue
    map.set(scheduleId, session)
  }
  return map
}

function educationSlotDeliveryScheduleStatus(
  slot: ProgramEducationSlotResponse
): SessionProgressScheduleStatus {
  // education-slots.scheduleStatus(ACTIVE 등)는 교육 진행 상태가 아니다. 시각으로 산출한다.
  return resolveEducationProgressFromScheduleBounds({
    startAt: slot.startAt,
    endAt: slot.endAt,
  }) === 'completed'
    ? 'COMPLETED'
    : 'SCHEDULED'
}

function educationSlotToParticipatingSession(
  slot: ProgramEducationSlotResponse
): ParticipatingSchoolSession | null {
  const scheduleId = positiveScheduleId(slot.scheduleId)
  if (scheduleId == null) return null
  const progress: SessionProgress & {
    educationSlotKey?: string
  } = {
    scheduleId,
    sessionNo: slot.sessionNo,
    startAt: slot.startAt,
    endAt: slot.endAt,
    scheduleStatus: educationSlotDeliveryScheduleStatus(slot),
    ...(slot.educationSlotKey?.trim() ? { educationSlotKey: slot.educationSlotKey.trim() } : {}),
    ...(slot.scheduleRole?.trim() ? { scheduleRole: slot.scheduleRole.trim() as SessionProgressScheduleRole } : {}),
  }
  return mapSessionProgressToParticipatingSchoolSessions([progress])[0] ?? null
}

/**
 * 참여자(개인) 상세 「교육 진행 일정」 — education-scope.scheduleIds에 배정된 일정만 표시한다.
 * participants sessions에 진행 상태가 있으면 그대로 쓰고, 없으면 education-slots로 날짜만 채운다.
 */
export function resolveParticipatingIndividualProgressScheduleSessions(input: {
  participantSessions?: ReadonlyArray<ParticipatingSchoolSession> | null
  assignedScheduleIds?: ReadonlyArray<number> | null
  educationSlots?: ReadonlyArray<ProgramEducationSlotResponse> | null
}): ParticipatingSchoolSession[] {
  const assignedIds = (input.assignedScheduleIds ?? [])
    .map(positiveScheduleId)
    .filter((id): id is number => id != null)
  if (assignedIds.length === 0) return []

  const sessionByScheduleId = participantSessionsByScheduleId(
    input.participantSessions ?? undefined
  )
  const slotByScheduleId = new Map<number, ProgramEducationSlotResponse>()
  for (const slot of input.educationSlots ?? []) {
    const scheduleId = positiveScheduleId(slot.scheduleId)
    if (scheduleId == null) continue
    slotByScheduleId.set(scheduleId, slot)
  }

  const result: ParticipatingSchoolSession[] = []
  assignedIds.forEach(scheduleId => {
    const fromParticipant = sessionByScheduleId.get(scheduleId)
    if (fromParticipant) {
      result.push(fromParticipant)
      return
    }
    const slot = slotByScheduleId.get(scheduleId)
    if (!slot) return
    const fromSlot = educationSlotToParticipatingSession(slot)
    if (fromSlot) result.push(fromSlot)
  })
  return result
}

/**
 * 교육 참여자 목록 「교육 진행 일정」.
 * GET …/participants INDIVIDUAL `sessions`(education-scope 배정)만 쓴다.
 * 공통 예정일·educationScheduleLines 치환 금지.
 */
export function resolveParticipatingIndividualProgressScheduleSessionsFallback(
  participantSessions?: ReadonlyArray<ParticipatingSchoolSession> | null
): ParticipatingSchoolSession[] {
  return resolveParticipatingProgressAssignedSessions([...(participantSessions ?? [])])
}
