import {
  mapPreferredEducationSchedulesToSessions,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

/**
 * 일반 기관 프로그램 — 교육 일정 3종 SSOT (다중 기관·다중 신청)
 *
 * ① 프로그램 교육 진행 예정일: `programId` — GET programs/{id}/education-slots (공통정보는 lines PATCH)
 * ② 기관 희망 일정: `organizationApplicationId` (신청 목록·상세. 진행 현황 표시에는 쓰지 않음)
 * ③ 실제 배정: `programId` + `organizationApplicationId` — OSA GET schedule-assignments
 *    진행 현황 목록은 참여자 API `sessions`(확정 배정)를, 상세는 OSA 배정(없으면 같은 sessions)을 쓴다.
 *
 * 동일 프로그램 내 기관 A/B, 동일 기관의 다른 프로그램 신청 데이터를 혼합하지 않는다.
 * 신청 id는 전역 유일하나, FE는 programId·organizationApplicationId를 함께 검증한다.
 */

export type OrganizationApplicationScheduleScope = {
  programId: string
  organizationApplicationId: string
}

const SCOPE_KEY_SEPARATOR = '::'

export function buildOrganizationApplicationScheduleScopeKey(
  programId: string,
  organizationApplicationId: string
): string {
  return `${programId.trim()}${SCOPE_KEY_SEPARATOR}${organizationApplicationId.trim()}`
}

export function parseOrganizationApplicationScheduleScopeKey(
  key: string
): OrganizationApplicationScheduleScope | null {
  const idx = key.indexOf(SCOPE_KEY_SEPARATOR)
  if (idx <= 0) return null
  const programId = key.slice(0, idx).trim()
  const organizationApplicationId = key.slice(idx + SCOPE_KEY_SEPARATOR.length).trim()
  if (!programId || !organizationApplicationId) return null
  return { programId, organizationApplicationId }
}

/** OSA — programId + organizationApplicationId */
export function organizationScheduleAssignmentsQueryKey(
  programId: string,
  organizationApplicationId: string
) {
  return [
    ...generalProgramProgressQueryKeys.all,
    'organization-schedule-assignments',
    programId.trim(),
    organizationApplicationId.trim(),
  ] as const
}

/** 프로그램 공통 예정 슬롯 — programId only */
export function organizationProgramPlannedSchedulesQueryKey(programId: string) {
  return generalProgramQueryKeys.educationSlots(programId.trim())
}

const DISPLAYABLE_ASSIGNMENT_STATUSES = new Set(['TEMP_ASSIGNED', 'CONFIRMED'])

function resolveSlotProgramScheduleId(slot: SlotResponse): number | null {
  const raw =
    (slot as SlotResponse & { programScheduleId?: number | null }).programScheduleId ??
    slot.scheduleId
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null
  return Math.trunc(raw)
}

function resolveSlotActive(slot: SlotResponse): boolean {
  const raw = (slot as SlotResponse & { activeYn?: boolean | null }).activeYn ?? slot.active
  return raw !== false
}

function slotMatchesOrganizationApplicationScope(
  slot: SlotResponse,
  scope: OrganizationApplicationScheduleScope
): boolean {
  const orgAppId = slot.organizationApplicationId
  if (orgAppId != null && String(orgAppId) !== String(scope.organizationApplicationId)) {
    return false
  }
  const slotProgramId = slot.programId
  if (slotProgramId != null && String(slotProgramId) !== String(scope.programId)) {
    return false
  }
  return true
}

/** OSA 목록 — 활성 배정 + (제공 시) 신청·프로그램 scope 일치 */
export function filterOrganizationScheduleAssignmentSlotsForDisplay(
  slots: ReadonlyArray<SlotResponse>,
  scope?: OrganizationApplicationScheduleScope
): SlotResponse[] {
  return slots.filter(slot => {
    if (scope != null && !slotMatchesOrganizationApplicationScope(slot, scope)) return false
    if (!resolveSlotActive(slot)) return false
    if (slot.cancelledAt?.trim()) return false
    const status = (slot.assignmentStatus ?? '').trim().toUpperCase()
    if (status === 'CANCELLED') return false
    if (status && !DISPLAYABLE_ASSIGNMENT_STATUSES.has(status)) return false
    return resolveSlotProgramScheduleId(slot) != null
  })
}

function formatKoreanInterviewTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = parts.find(part => part.type === 'hour')?.value ?? '00'
  const minute = parts.find(part => part.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

function formatPreferredScheduleDate(date: Date): { date: string; dayOfWeek: string } {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return {
    date: `${value('year')}.${value('month')}.${value('day')}`,
    dayOfWeek: value('weekday').replace('요일', ''),
  }
}

function mapProgramScheduleAndSlotToSession(
  schedule: ProgramScheduleResponse,
  slot: SlotResponse,
  order: number
): ParticipatingSchoolSession {
  const scheduleId = schedule.id
  const startRaw = schedule.startAt ?? schedule.startDate
  const endRaw = schedule.endAt ?? schedule.endDate ?? startRaw
  const start = startRaw ? new Date(startRaw) : null
  const end = endRaw ? new Date(endRaw) : null
  const validStart = start != null && !Number.isNaN(start.getTime())
  const validEnd = end != null && !Number.isNaN(end.getTime())
  const dateParts = validStart
    ? formatPreferredScheduleDate(start)
    : { date: '-', dayOfWeek: '-' }
  const timeRange =
    validStart && validEnd
      ? `${formatKoreanInterviewTime(start)} ~ ${formatKoreanInterviewTime(end)}`
      : '-'
  const duration =
    validStart && validEnd && end.getTime() > start.getTime()
      ? `${Math.round((end.getTime() - start.getTime()) / 60_000)}분`
      : '-'
  const round =
    typeof schedule.sessionNo === 'number' && Number.isFinite(schedule.sessionNo)
      ? schedule.sessionNo
      : order + 1
  const scheduleLabel = toDisplayEducationScheduleName(schedule.scheduleName) || `${round}회차`
  const assignmentId = slot.assignmentId
  return {
    round,
    ...dateParts,
    duration,
    format: scheduleLabel,
    classNum: `${round}회차`,
    timeRange,
    status: 'pending',
    deliveryScheduleStatus: schedule.scheduleStatus?.trim() || undefined,
    resolvedScheduleId:
      typeof scheduleId === 'number' && Number.isFinite(scheduleId) && scheduleId > 0
        ? Math.trunc(scheduleId)
        : resolveSlotProgramScheduleId(slot),
    ...(typeof assignmentId === 'number' && assignmentId > 0
      ? { osaAssignmentId: assignmentId }
      : {}),
  }
}

/**
 * OSA 슬롯 + 프로그램 schedules 메타 → 참여 상세 「교육 진행 일정」.
 * scheduleId당 OSA row 수만큼 노출 (dedupe 하지 않음). GENERAL는 schedule-only.
 */
export function mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
  slots: ReadonlyArray<SlotResponse>,
  programSchedules: ReadonlyArray<ProgramScheduleResponse>,
  scope: OrganizationApplicationScheduleScope
): ParticipatingSchoolSession[] {
  const scheduleById = new Map<number, ProgramScheduleResponse>()
  for (const schedule of programSchedules) {
    const id = schedule.id
    if (id == null || !Number.isFinite(id) || id <= 0) continue
    scheduleById.set(Math.trunc(id), schedule)
  }

  const displaySlots = filterOrganizationScheduleAssignmentSlotsForDisplay(slots, scope)
  const sessions: ParticipatingSchoolSession[] = []

  for (let index = 0; index < displaySlots.length; index += 1) {
    const slot = displaySlots[index]!
    const scheduleId = resolveSlotProgramScheduleId(slot)
    if (scheduleId == null) continue
    const schedule = scheduleById.get(scheduleId)
    if (schedule == null) {
      const assignmentId = slot.assignmentId
      sessions.push({
        round: index + 1,
        date: '-',
        dayOfWeek: '-',
        duration: '-',
        format: '-',
        classNum: `${index + 1}회차`,
        timeRange: '-',
        status: 'pending',
        resolvedScheduleId: scheduleId,
        ...(typeof assignmentId === 'number' && assignmentId > 0
          ? { osaAssignmentId: assignmentId }
          : {}),
      })
      continue
    }
    sessions.push(mapProgramScheduleAndSlotToSession(schedule, slot, index))
  }

  return sessions.sort((a, b) => {
    const byAssignment = (a.osaAssignmentId ?? 0) - (b.osaAssignmentId ?? 0)
    if (byAssignment !== 0) return byAssignment
    return (
      (a.resolvedScheduleId ?? 0) - (b.resolvedScheduleId ?? 0) || a.round - b.round
    )
  })
}

/** 진행 현황 — 확정/배정 일정. 미확정 희망(`scheduleUnresolved`)은 제외한다. */
export function resolveParticipatingProgressAssignedSessions(
  sessions: ParticipatingSchoolSession[] | undefined
): ParticipatingSchoolSession[] {
  return (sessions ?? []).filter(session => session.scheduleUnresolved !== true)
}

/**
 * 참여 기관 상세 「교육 진행 일정」.
 * 일반 기관은 OSA 배정이 있으면 배정을, 없으면 참여자 API의 확정 일정을 쓴다.
 */
export function resolveParticipatingInstitutionApplicationScheduleSessions(input: {
  isCompanySchool: boolean
  isGeneralOrganization: boolean
  assignedSessions: ParticipatingSchoolSession[]
  participantSessions: ParticipatingSchoolSession[]
}): ParticipatingSchoolSession[] {
  if (input.isCompanySchool) return input.participantSessions
  if (input.isGeneralOrganization && input.assignedSessions.length > 0) {
    return input.assignedSessions
  }
  return resolveParticipatingProgressAssignedSessions(input.participantSessions)
}

/** 기관 신청 희망 일정 — 신청 화면용. 진행 현황 목록·상세 표시에는 쓰지 않는다. */
export function resolveParticipatingSchoolHopeSessions(
  row: Pick<
    ParticipatingSchoolRow,
    'hopeEducationSessions' | 'preferredEducationSchedules' | 'sessions' | 'programId' | 'organizationApplicationId'
  >,
  scope?: OrganizationApplicationScheduleScope
): ParticipatingSchoolSession[] {
  if (scope != null) {
    if (row.programId != null && String(row.programId) !== String(scope.programId)) {
      return []
    }
    if (
      row.organizationApplicationId != null &&
      String(row.organizationApplicationId) !== String(scope.organizationApplicationId)
    ) {
      return []
    }
  }
  if (row.hopeEducationSessions?.length) return row.hopeEducationSessions
  if (row.preferredEducationSchedules?.length) {
    return mapPreferredEducationSchedulesToSessions(row.preferredEducationSchedules)
  }
  return []
}

export function buildHopeEducationSessionsFromPreferred(
  preferred: PreferredEducationSchedule[]
): ParticipatingSchoolSession[] {
  return mapPreferredEducationSchedulesToSessions(preferred)
}

/** 신청 목록 enrich — programId + organizationApplicationId 복합 키 */
export function readPreferredEducationSchedulesForScope(
  preferredByScopeKey: ReadonlyMap<string, PreferredEducationSchedule[]>,
  scope: OrganizationApplicationScheduleScope
): PreferredEducationSchedule[] {
  return preferredByScopeKey.get(buildOrganizationApplicationScheduleScopeKey(
    scope.programId,
    scope.organizationApplicationId
  )) ?? []
}
