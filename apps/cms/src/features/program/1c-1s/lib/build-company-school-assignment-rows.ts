/**
 * 1사1교 강사 배정 대기/배정행 — API 전용 (mock 희망일·해시 충돌 없음)
 */

import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  participatingSchoolSessionToHopeSchedule,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorAssignmentStatus,
} from '@/features/program/general/lib/waiting-instructor-assignment'
import { resolveOneSchoolPerDayAssignmentStatus } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import { extractLectureDateKey } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'

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
  organizationName?: string
  assignedDate?: string
  assignedTime?: string
  assignedSession?: string
  assignmentId?: string
  instructorMemberId?: string
  scheduleId?: string
  organizationApplicationId?: string
}

function formatDistanceKm(km: number | undefined): string | undefined {
  if (km == null || Number.isNaN(km)) return undefined
  const rounded = Math.round(km)
  return `${rounded}km`
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
}): CompanySchoolWaitingInstructorRow[] {
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
        distanceToSchool: formatDistanceKm(app.distanceKm),
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
  const n = sorted.length
  return sorted.map((row, index) => ({ ...row, no: n - index }))
}

/** 기관(organizationApplicationId)에 속한 배정 행 */
export function buildCompanySchoolAssignedInstructorRows(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  organizationApplicationId: string
  instructorNameByMemberId: Map<string, string>
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
}): CompanySchoolAssignedInstructorRow[] {
  const orgId = input.organizationApplicationId
  const filtered = input.assignments.filter(a => {
    if (a.organizationApplicationId == null) return false
    if (String(a.organizationApplicationId) !== orgId) return false
    const status = (a.assignmentStatus ?? '').toUpperCase()
    return status !== 'CANCELLED' && status !== 'CANCELED'
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
      no: filtered.length - index,
      role: a.scheduleLead ? ('lead' as const) : ('assistant' as const),
      instructorName:
        a.instructorName?.trim() ||
        input.instructorNameByMemberId.get(memberId) ||
        (memberId || '이름 없음'),
      homeAddress: a.homeAddress,
      distanceToSchool: distanceLabel,
      longDistance: a.longDistance,
      organizationName: a.organizationName,
      assignedDate: lectureDate,
      assignedTime: label?.time,
      assignedSession: label?.session,
      assignmentId: a.assignmentId != null ? String(a.assignmentId) : undefined,
      instructorMemberId: memberId || undefined,
      scheduleId: scheduleId || undefined,
      organizationApplicationId: orgId,
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
