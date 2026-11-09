/**
 * 1사1교 강사 배정 대기/배정행 — API 전용 (mock 희망일·해시 충돌 없음)
 */

import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  participatingSchoolSessionToHopeSchedule,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorAssignmentStatus,
} from '@/features/program/general/lib/waiting-instructor-assignment'
import { resolveOneSchoolPerDayAssignmentStatus } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import { extractLectureDateKey } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'
import {
  collectInstructorApplicationOrganizationDistances,
  findWaitingOrganizationDistance,
} from '@/features/program/general/lib/assignment-waiting-distance'
import {
  readRuntimeBoolean,
  readRuntimeNumber,
} from '@/shared/lib/openapi-runtime-field'

export type CompanySchoolWaitingInstructorRow = {
  id: string
  instructorId: string
  scheduleKey: string
  no: number
  instructorName: string
  homeAddress?: string
  distanceToSchool?: string
  assignmentStatus: WaitingInstructorAssignmentStatus
  hopeDate?: string
  hopeTime?: string
  hopeSession?: string
  hopeScheduleLine?: string
  instructorApplicationId?: string
  instructorMemberId?: string
  /** create body requestedScheduleId */
  requestedScheduleId?: number
  resolvedScheduleId?: number | null
  /** resolvedScheduleId null — 배정 불가(일정 미생성) */
  scheduleUnresolved?: boolean
}

export type CompanySchoolAssignedInstructorRow = {
  id: string
  no: number
  role: 'lead' | 'assistant'
  instructorName: string
  homeAddress?: string
  distanceToSchool?: string
  longDistance?: boolean
  /** 기관 신청 배정이 참조하는 실제 기관 ID. 개인 출강지이면 null */
  organizationId?: number | null
  organizationName?: string
  assignedDate?: string
  assignedTime?: string
  assignedSession?: string
  assignmentId?: string
  instructorMemberId?: string
  scheduleId?: string
  organizationApplicationId?: string
  /** 서버 assignmentStatus CANCELLED — 「배정 취소」로만 표시(재배정 불가, 2026-11-09 확정) */
  assignmentCancelled: boolean
}

function formatDistanceKm(km: number | undefined): string | undefined {
  const label = formatApiDistanceKmDisplay(km)
  return label === '-' ? undefined : label
}

function formatWaitingInstructorDistance(
  app: InstructorApplicationListItemResponse
): string | undefined {
  const km = readRuntimeNumber(app, 'distanceKm')
  const longDistance = readRuntimeBoolean(app, 'longDistance')
  if (longDistance && km != null) {
    const core = formatDistanceKm(km)
    return core ? `${core} (장거리)` : undefined
  }
  return formatDistanceKm(km)
}

/** 일반 기관형 — 이 기관 신청까지의 거리만 쓴다. 없으면 표시하지 않는다(다른 기관 거리 대체 금지). */
function formatWaitingInstructorOrganizationDistance(
  app: InstructorApplicationListItemResponse,
  organizationApplicationId: string
): string | undefined {
  const hit = findWaitingOrganizationDistance(
    collectInstructorApplicationOrganizationDistances(app),
    { organizationApplicationId }
  )
  const label = formatApiDistanceKmDisplay(hit?.distanceKm, { longDistance: hit?.longDistance })
  return label === '-' ? undefined : label
}

function hopeScheduleLineFromSession(session: ParticipatingSchoolSession): string {
  const hope = participatingSchoolSessionToHopeSchedule(session)
  const base = [hope.hopeDate, hope.hopeTime, hope.hopeSession].filter(Boolean).join(' ')
  if (session.scheduleUnresolved) {
    return base ? `${base} (일정 미생성)` : '일정 미생성'
  }
  return base
}

/**
 * 승인 강사 × 기관 희망일정(실데이터) → 배정 대기 행.
 * 희망일 없으면 행을 만들지 않음(가짜 일정 금지).
 * scheduleUnresolved면 unavailable.
 */
export function buildCompanySchoolWaitingInstructorRows(input: {
  schoolName: string
  sessions: ParticipatingSchoolSession[] | undefined
  approvedInstructors: InstructorApplicationListItemResponse[]
  assignedInstructorMemberIds: Set<string>
  occupiedLectureDatesByInstructorId?: Map<string, Set<string>> | null
  /**
   * 일반 기관형만 넘긴다. 있으면 「기관과의 거리」를 강사 신청의 기관별 거리에서 이 기관 신청 id로 찾는다.
   * 없으면(1사1교) 기존처럼 신청 단위 distanceKm를 쓴다.
   */
  organizationApplicationId?: string | null
}): CompanySchoolWaitingInstructorRow[] {
  const organizationApplicationId = input.organizationApplicationId?.trim() || null
  const sessions = (input.sessions ?? []).filter(s => Boolean(extractLectureDateKey(s.date) || s.date))
  if (sessions.length === 0) return []

  const candidates = input.approvedInstructors.filter(app => {
    const memberId = app.instructorMemberId != null ? String(app.instructorMemberId) : ''
    if (!memberId) return false
    if (input.assignedInstructorMemberIds.has(memberId)) return false
    const status = (app.applicationStatus ?? '').toUpperCase()
    return status === 'APPROVED' || status === 'WAITING_ASSIGNMENT' || status === 'ASSIGNED'
  })

  const rows: CompanySchoolWaitingInstructorRow[] = []
  for (const app of candidates) {
    const memberId = String(app.instructorMemberId)
    const occupied =
      input.occupiedLectureDatesByInstructorId?.get(memberId) ??
      (app.id != null
        ? input.occupiedLectureDatesByInstructorId?.get(String(app.id))
        : undefined)

    for (const session of sessions) {
      const hope = participatingSchoolSessionToHopeSchedule(session)
      const scheduleKey = `${session.date}|${session.round}|${session.classNum}`
      const conflictStatus = resolveOneSchoolPerDayAssignmentStatus(
        hope.hopeDate ?? session.date,
        occupied
      )
      const assignmentStatus: WaitingInstructorAssignmentStatus =
        session.scheduleUnresolved ? 'unavailable' : conflictStatus

      rows.push({
        id: `${memberId}__${scheduleKey}`,
        instructorId: memberId,
        scheduleKey,
        no: 0,
        instructorName: app.instructorName?.trim() || '이름 없음',
        homeAddress: app.homeAddress?.trim() || undefined,
        distanceToSchool: organizationApplicationId
          ? formatWaitingInstructorOrganizationDistance(app, organizationApplicationId)
          : formatWaitingInstructorDistance(app),
        assignmentStatus,
        hopeDate: hope.hopeDate,
        hopeTime: hope.hopeTime,
        hopeSession: hope.hopeSession,
        hopeScheduleLine: hopeScheduleLineFromSession(session),
        instructorApplicationId: app.id != null ? String(app.id) : undefined,
        instructorMemberId: memberId,
        requestedScheduleId: session.requestedScheduleId,
        resolvedScheduleId: session.resolvedScheduleId,
        scheduleUnresolved: session.scheduleUnresolved,
      })
    }
  }

  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  return sorted.map((row, index) => ({ ...row, no: index + 1 }))
}

/** 기관(organizationApplicationId)에 속한 배정 행 */
export function buildCompanySchoolAssignedInstructorRows(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  organizationApplicationId: string
  instructorNameByMemberId: Map<string, string>
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  /** 1사1교 학교 상세 — 취소된 배정도 「배정 취소」 행으로 포함 */
  includeCancelled?: boolean
}): CompanySchoolAssignedInstructorRow[] {
  const orgId = input.organizationApplicationId
  const isCancelled = (a: InstructorAssignmentListItemEnriched) =>
    (a.assignmentStatus ?? '').toUpperCase() === 'CANCELLED'
  const filtered = input.assignments.filter(a => {
    if (a.organizationApplicationId == null) return false
    if (String(a.organizationApplicationId) !== orgId) return false
    return input.includeCancelled === true || !isCancelled(a)
  })

  return filtered.map((a, index) => {
    const memberId = a.instructorMemberId != null ? String(a.instructorMemberId) : ''
    const scheduleId = a.scheduleId != null ? String(a.scheduleId) : ''
    const label = scheduleId ? input.scheduleLabelById.get(scheduleId) : undefined
    const lectureDate = extractLectureDateKey(a.lectureDate) ?? label?.date
    const distanceLabel =
      a.longDistance && a.distanceKm != null
        ? `${formatDistanceKm(a.distanceKm)} (장거리)`
        : formatDistanceKm(a.distanceKm)

    return {
      id: a.assignmentId != null ? String(a.assignmentId) : `assign-${index}`,
      no: index + 1,
      role: a.scheduleLead ? ('lead' as const) : ('assistant' as const),
      instructorName:
        a.instructorName?.trim() ||
        input.instructorNameByMemberId.get(memberId) ||
        (memberId || '이름 없음'),
      homeAddress: a.homeAddress,
      distanceToSchool: distanceLabel,
      longDistance: a.longDistance,
      organizationId: a.organizationId ?? null,
      organizationName: a.organizationName,
      assignedDate: lectureDate,
      assignedTime: label?.time,
      assignedSession: label?.session,
      assignmentId: a.assignmentId != null ? String(a.assignmentId) : undefined,
      instructorMemberId: memberId || undefined,
      scheduleId: scheduleId || undefined,
      organizationApplicationId: orgId,
      assignmentCancelled: isCancelled(a),
    }
  })
}

/** ParticipatingInstructorRow 목록에서 memberId 집합 (배정 제외용) */
export function collectAssignedInstructorMemberIds(
  instructorsForSchool: ParticipatingInstructorRow[]
): Set<string> {
  const set = new Set<string>()
  for (const row of instructorsForSchool) {
    if (row.memberId) set.add(row.memberId)
    set.add(row.id)
  }
  return set
}
