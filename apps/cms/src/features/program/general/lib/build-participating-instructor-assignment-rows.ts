/**
 * 참여 강사 상세 — 교육 배정 현황 탭 (강사 관점 assignment board 조인)
 */

import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import {
  buildParticipatingSchoolPreferredScheduleLines,
  buildParticipatingSchoolSessionLines,
} from '@/features/program/general/lib/participating-school-session-display'
import {
  sortWaitingRowsAssignedToBottom,
  type InstructorAssignedSchoolRow,
  type InstructorWaitingSchoolRow,
} from '@/features/program/general/lib/instructor-institution-assignment'
import type {
  ParticipatingIndividualInstructorAssignedScheduleRow,
  ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import { extractLectureDateKey } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import { getParticipatingSchoolAssignmentSessions } from '@/features/program/general/lib/participating-school-assignment-sessions'
import { hasAssignableOrganizationInstructorSchedule } from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'

function scheduleLinesForSchool(school: ParticipatingSchoolRow): string[] {
  const fromSessions = buildParticipatingSchoolSessionLines(
    getParticipatingSchoolAssignmentSessions(school)
  )
  return fromSessions.length > 0 ? fromSessions : ['-']
}

function resolveSchoolIdForAssignment(
  assignment: InstructorAssignmentListItemEnriched,
  schoolRows: ParticipatingSchoolRow[]
): string {
  const orgAppId =
    assignment.organizationApplicationId != null
      ? String(assignment.organizationApplicationId)
      : ''
  if (orgAppId) {
    const matched = schoolRows.find(s => s.organizationApplicationId === orgAppId)
    if (matched) return matched.id
  }
  const orgName = assignment.organizationName?.trim()
  if (orgName) {
    const matched = schoolRows.find(s => s.schoolName === orgName)
    if (matched) return matched.id
  }
  return assignment.assignmentId != null ? `assign-${assignment.assignmentId}` : orgAppId || orgName || 'unknown'
}

function groupAssignmentsBySchool(
  assignments: InstructorAssignmentListItemEnriched[],
  instructorMemberId: string
): InstructorAssignmentListItemEnriched[][] {
  const filtered = assignments.filter(a => {
    if (a.instructorMemberId == null) return false
    if (String(a.instructorMemberId) !== instructorMemberId) return false
    const status = (a.assignmentStatus ?? '').toUpperCase()
    return status !== 'CANCELLED' && status !== 'CANCELED'
  })

  const groups = new Map<string, InstructorAssignmentListItemEnriched[]>()
  for (const assignment of filtered) {
    const key = [
      assignment.organizationApplicationId ?? '',
      assignment.organizationName ?? '',
    ].join('|')
    const prev = groups.get(key)
    if (prev) prev.push(assignment)
    else groups.set(key, [assignment])
  }
  return Array.from(groups.values())
}

export type ParticipatingInstructorAssignedSchoolRowRemote = InstructorAssignedSchoolRow & {
  assignmentIds: string[]
  organizationApplicationId?: string
}

/** 강사 memberId 기준 배정된 기관 행 */
export function buildParticipatingInstructorAssignedSchoolRowsFromBoard(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
  schoolRows: ParticipatingSchoolRow[]
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
}): ParticipatingInstructorAssignedSchoolRowRemote[] {
  const groups = groupAssignmentsBySchool(input.assignments, input.instructorMemberId)
  const rows: ParticipatingInstructorAssignedSchoolRowRemote[] = []

  groups.forEach((group, groupIndex) => {
    const primary = group[0]
    const schoolId = resolveSchoolIdForAssignment(primary, input.schoolRows)
    const school =
      input.schoolRows.find(s => s.id === schoolId) ??
      input.schoolRows.find(s => s.schoolName === primary.organizationName?.trim())

    const scheduleLines = group.flatMap(a => {
      const scheduleId = a.scheduleId != null ? String(a.scheduleId) : ''
      const label = scheduleId ? input.scheduleLabelById.get(scheduleId) : undefined
      const lectureDate = extractLectureDateKey(a.lectureDate) ?? label?.date
      const time = label?.time
      const session = label?.session
      const parts = [lectureDate, time, session].filter(Boolean)
      if (parts.length > 0) return [parts.join(' | ')]
      if (school) return scheduleLinesForSchool(school)
      return ['-']
    })

    const hasLead = group.some(a => a.scheduleLead === true)
    rows.push({
      id: schoolId,
      no: groups.length - groupIndex,
      role: (hasLead ? 'lead' : 'assistant') satisfies InstructorRoleKey,
      schoolName: school?.schoolName ?? primary.organizationName?.trim() ?? '-',
      educationGrade: school?.educationGrade ?? '-',
      region: school?.region ?? '-',
      distanceFromHome: formatApiDistanceKmDisplay(primary.distanceKm, {
        longDistance: primary.longDistance,
      }),
      educationScheduleLines: [...new Set(scheduleLines.length > 0 ? scheduleLines : ['-'])],
      assignmentId:
        primary.assignmentId != null ? String(primary.assignmentId) : undefined,
      assignmentIds: group
        .map(a => (a.assignmentId != null ? String(a.assignmentId) : ''))
        .filter(Boolean),
      instructorMemberId:
        primary.instructorMemberId != null
          ? String(primary.instructorMemberId)
          : input.instructorMemberId,
      scheduleId: primary.scheduleId != null ? String(primary.scheduleId) : undefined,
      organizationApplicationId:
        primary.organizationApplicationId != null
          ? String(primary.organizationApplicationId)
          : school?.organizationApplicationId,
      schoolId,
    })
  })

  return rows.sort((a, b) => a.no - b.no)
}

function resolveWaitingAssignmentStatus(
  sessions: ParticipatingSchoolSession[]
): InstructorWaitingSchoolRow['assignmentStatus'] {
  return hasAssignableOrganizationInstructorSchedule(sessions)
    ? 'waiting'
    : 'no_assignable_schedule'
}

function buildScheduleGroups(assignmentSessions: ParticipatingSchoolSession[]) {
  const groups = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of assignmentSessions) {
    const scheduleKey = `${session.date}|${session.dayOfWeek}`
    const prev = groups.get(scheduleKey)
    if (prev) prev.push(session)
    else groups.set(scheduleKey, [session])
  }
  const preferredLines = buildParticipatingSchoolPreferredScheduleLines(assignmentSessions)
  return Array.from(groups.entries()).map(([scheduleKey, sessions], index) => ({
    scheduleKey,
    sessions,
    line: preferredLines[index] ?? buildParticipatingSchoolSessionLines(sessions)[0] ?? '-',
  }))
}

function isCancelledAssignment(assignment: InstructorAssignmentListItemEnriched): boolean {
  const status = (assignment.assignmentStatus ?? '').toUpperCase()
  return status === 'CANCELLED' || status === 'CANCELED'
}

function assignedScheduleKey(scope: string, scheduleId: number | string): string {
  return `${scope}|${scheduleId}`
}

/** 강사 무관 — (기관 신청 + scheduleId)별 취소되지 않은 배정 강사 memberId. 신청 id가 없으면 기관명으로 묶는다. */
function buildAssignedInstructorsBySchedule(
  assignments: InstructorAssignmentListItemEnriched[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const a of assignments) {
    if (a.scheduleId == null || a.instructorMemberId == null || isCancelledAssignment(a)) continue
    const orgName = a.organizationName?.trim()
    const scope =
      a.organizationApplicationId != null
        ? `app:${a.organizationApplicationId}`
        : orgName
          ? `name:${orgName}`
          : null
    if (!scope) continue
    const key = assignedScheduleKey(scope, a.scheduleId)
    const members = map.get(key) ?? new Set<string>()
    members.add(String(a.instructorMemberId))
    map.set(key, members)
  }
  return map
}

function countAssignedInstructorsForSession(
  school: ParticipatingSchoolRow,
  session: ParticipatingSchoolSession,
  assignedBySchedule: Map<string, Set<string>>
): number {
  const scheduleId = session.resolvedScheduleId
  if (scheduleId == null) return 0
  const orgAppId = school.organizationApplicationId
  const scope = orgAppId ? `app:${orgAppId}` : `name:${school.schoolName}`
  return assignedBySchedule.get(assignedScheduleKey(scope, scheduleId))?.size ?? 0
}

/** 최대 배정 가능 강사 수(maxAssignableInstructors) 이상 배정된 일정 — 값이 없으면 cap 없음 */
function isSessionAtInstructorCap(
  school: ParticipatingSchoolRow,
  session: ParticipatingSchoolSession,
  assignedBySchedule: Map<string, Set<string>>,
  maxAssignableInstructors: number | null
): boolean {
  if (maxAssignableInstructors == null) return false
  return countAssignedInstructorsForSession(school, session, assignedBySchedule) >= maxAssignableInstructors
}

function normalizeMaxAssignableInstructors(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

/**
 * 배정 대기 행과 동일 기준((기관 신청 + scheduleId)별 취소 제외 배정 강사 수 >= maxAssignableInstructors)으로
 * 회차가 정원에 도달했는지 판별 — 배정 안내 창 일정 선택 비활성화용. cap 값이 없으면 항상 false.
 */
export function createSessionInstructorCapChecker(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  maxAssignableInstructors?: number | null
}): (school: ParticipatingSchoolRow, session: ParticipatingSchoolSession) => boolean {
  const maxAssignableInstructors = normalizeMaxAssignableInstructors(input.maxAssignableInstructors)
  if (maxAssignableInstructors == null) return () => false
  const assignedBySchedule = buildAssignedInstructorsBySchedule(input.assignments)
  return (school, session) =>
    isSessionAtInstructorCap(school, session, assignedBySchedule, maxAssignableInstructors)
}

/** 이 강사 배정을 기관 행(schoolId)별 scheduleId 집합으로 — scheduleId 없는 배정은 '*' */
function collectOwnAssignmentScheduleIdsBySchool(
  assignments: InstructorAssignmentListItemEnriched[],
  instructorMemberId: string,
  schoolRows: ParticipatingSchoolRow[]
): { active: Map<string, Set<string>>; cancelled: Map<string, Set<string>> } {
  const active = new Map<string, Set<string>>()
  const cancelled = new Map<string, Set<string>>()
  for (const a of assignments) {
    if (a.instructorMemberId == null || String(a.instructorMemberId) !== instructorMemberId) continue
    const schoolId = resolveSchoolIdForAssignment(a, schoolRows)
    const target = isCancelledAssignment(a) ? cancelled : active
    const ids = target.get(schoolId) ?? new Set<string>()
    ids.add(a.scheduleId != null ? String(a.scheduleId) : '*')
    target.set(schoolId, ids)
  }
  return { active, cancelled }
}

/** 기관형 — 확정 회차를 scheduleId(resolvedScheduleId)별로 묶는다. 회차 순서 유지 */
function groupSessionsByResolvedScheduleId(
  sessions: ParticipatingSchoolSession[]
): Array<{ scheduleId: string; sessions: ParticipatingSchoolSession[] }> {
  const groups = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of sessions) {
    if (session.resolvedScheduleId == null) continue
    const key = String(session.resolvedScheduleId)
    const prev = groups.get(key)
    if (prev) prev.push(session)
    else groups.set(key, [session])
  }
  return Array.from(groups.entries()).map(([scheduleId, grouped]) => ({ scheduleId, sessions: grouped }))
}

/**
 * 강사 관점 배정 대기.
 * - 1사1교: 기존 그대로 — 기관×날짜 행, 배정된 기관 제외, 정원 도달은 no_assignable_schedule.
 * - 기관형: 신청 기관 + 신청 일정(scheduleId)별 행.
 *   · 이 강사가 배정된 일정 행은 제외(배정 완료 비노출)
 *   · 이 강사의 배정이 취소된 일정은 배정 취소(assignment_cancelled)
 *   · 같은 기관 다른 일정에 이 강사가 배정돼 있으면 배정 불가(unavailable)
 *   · 일정별 배정 강사 수가 maxAssignableInstructors에 도달하면 배정 불가(unavailable)
 */
export function buildParticipatingInstructorWaitingSchoolRowsFromBoard(input: {
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  assignedSchoolIds: Set<string>
  isCompanySchool: boolean
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
  /** program participantRecruitmentInfo.maxAssignableInstructors — 없거나 0 이하면 cap 미적용 */
  maxAssignableInstructors?: number | null
}): InstructorWaitingSchoolRow[] {
  const assignedBySchedule = buildAssignedInstructorsBySchedule(input.assignments)
  const maxAssignableInstructors = normalizeMaxAssignableInstructors(input.maxAssignableInstructors)

  if (!input.isCompanySchool) {
    return buildInstitutionWaitingScheduleRows(input, assignedBySchedule, maxAssignableInstructors)
  }

  const assignedOrgAppIds = new Set<string>()
  for (const a of input.assignments) {
    if (a.instructorMemberId == null) continue
    if (String(a.instructorMemberId) !== input.instructorMemberId) continue
    const status = (a.assignmentStatus ?? '').toUpperCase()
    if (status === 'CANCELLED' || status === 'CANCELED') continue
    if (a.organizationApplicationId != null) {
      assignedOrgAppIds.add(String(a.organizationApplicationId))
    }
  }

  const rows: InstructorWaitingSchoolRow[] = []
  let rowNo = 0

  for (const school of input.schoolRows) {
    if (input.assignedSchoolIds.has(school.id)) continue
    const orgAppId = school.organizationApplicationId
    if (orgAppId && assignedOrgAppIds.has(orgAppId)) continue

    const assignmentSessions = getParticipatingSchoolAssignmentSessions(school)
    if (assignmentSessions.length === 0) continue
    // 1사1교 — 정원 도달도 기존 라벨(no_assignable_schedule) 유지
    const resolveStatus = (
      sessions: ParticipatingSchoolSession[]
    ): InstructorWaitingSchoolRow['assignmentStatus'] => {
      const baseStatus = resolveWaitingAssignmentStatus(sessions)
      if (baseStatus !== 'waiting') return baseStatus
      return resolveWaitingAssignmentStatus(
        sessions.filter(
          session =>
            !isSessionAtInstructorCap(school, session, assignedBySchedule, maxAssignableInstructors)
        )
      )
    }

    const groups = buildScheduleGroups(assignmentSessions)
    for (const group of groups) {
      rowNo += 1
      const assignmentStatus = resolveStatus(group.sessions)
      rows.push({
        id: `${school.id}__${group.scheduleKey}`,
        schoolId: school.id,
        scheduleKey: group.scheduleKey,
        sessions: group.sessions,
        no: rowNo,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: '-',
        educationScheduleLines: [group.line],
        assignmentStatus,
        assignedInstructorCountLabel: '-',
        organizationApplicationId: orgAppId,
        instructorApplicationId: input.instructor.instructorApplicationId,
        instructorMemberId: input.instructorMemberId,
        resolvedScheduleId: group.sessions[0]?.resolvedScheduleId ?? null,
        requestedScheduleId: group.sessions[0]?.requestedScheduleId,
        scheduleUnresolved: group.sessions.some(s => s.scheduleUnresolved),
      })
    }
  }

  return sortWaitingRowsAssignedToBottom(rows)
}

function buildInstitutionWaitingScheduleRows(
  input: Parameters<typeof buildParticipatingInstructorWaitingSchoolRowsFromBoard>[0],
  assignedBySchedule: Map<string, Set<string>>,
  maxAssignableInstructors: number | null
): InstructorWaitingSchoolRow[] {
  const own = collectOwnAssignmentScheduleIdsBySchool(
    input.assignments,
    input.instructorMemberId,
    input.schoolRows
  )

  const rows: InstructorWaitingSchoolRow[] = []
  let rowNo = 0

  for (const school of input.schoolRows) {
    const assignmentSessions = getParticipatingSchoolAssignmentSessions(school)
    if (assignmentSessions.length === 0) continue
    const orgAppId = school.organizationApplicationId
    const ownActive = own.active.get(school.id)
    const ownCancelled = own.cancelled.get(school.id)

    for (const group of groupSessionsByResolvedScheduleId(assignmentSessions)) {
      // 배정 완료(이 강사 배정 일정)는 대기 목록 비노출
      if (ownActive?.has(group.scheduleId)) continue
      const hasOwnCancelled = ownCancelled?.has(group.scheduleId) === true

      let assignmentStatus: InstructorWaitingSchoolRow['assignmentStatus']
      if (hasOwnCancelled) {
        assignmentStatus = 'assignment_cancelled'
      } else if (ownActive != null && ownActive.size > 0) {
        // 동일 기관 다른 희망 일정 — 자동 배정 불가
        assignmentStatus = 'unavailable'
      } else {
        const baseStatus = resolveWaitingAssignmentStatus(group.sessions)
        if (baseStatus !== 'waiting') {
          assignmentStatus = baseStatus
        } else {
          const capStatus = resolveWaitingAssignmentStatus(
            group.sessions.filter(
              session =>
                !isSessionAtInstructorCap(school, session, assignedBySchedule, maxAssignableInstructors)
            )
          )
          assignmentStatus = capStatus === 'waiting' ? 'waiting' : 'unavailable'
        }
      }

      rowNo += 1
      rows.push({
        id: `${school.id}__schedule-${group.scheduleId}`,
        no: rowNo,
        schoolId: school.id,
        scheduleKey: `schedule-${group.scheduleId}`,
        sessions: group.sessions,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: '-',
        educationScheduleLines: buildParticipatingSchoolSessionLines(group.sessions),
        assignmentStatus,
        assignedInstructorCountLabel: '-',
        organizationApplicationId: orgAppId,
        instructorApplicationId: input.instructor.instructorApplicationId,
        instructorMemberId: input.instructorMemberId,
        resolvedScheduleId: group.sessions[0]?.resolvedScheduleId ?? null,
        requestedScheduleId: group.sessions[0]?.requestedScheduleId,
      })
    }
  }

  return sortWaitingRowsAssignedToBottom(rows)
}

/**
 * 기관형 배정 확정 — 같은 기관의 일정별 대기 행을 기관 1건으로 합친다(회차 합집합, 첫 행 기준).
 * 배정 안내 창은 기관 단위로 회차를 고르므로 행별로 나누면 선택하지 않은 일정 행에서 막힌다.
 */
export function mergeInstitutionWaitingRowsBySchool(
  rows: InstructorWaitingSchoolRow[]
): InstructorWaitingSchoolRow[] {
  const merged = new Map<string, InstructorWaitingSchoolRow>()
  for (const row of rows) {
    const key = row.schoolId ?? row.id
    const prev = merged.get(key)
    if (!prev) {
      merged.set(key, { ...row, sessions: [...(row.sessions ?? [])] })
      continue
    }
    prev.sessions = [...(prev.sessions ?? []), ...(row.sessions ?? [])]
  }
  return Array.from(merged.values())
}

/** 개인형 — 배정 1건 = 일정 1행 */
export function buildParticipatingInstructorAssignedScheduleRowsFromBoard(input: {
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
  schoolRows: ParticipatingSchoolRow[]
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
}): ParticipatingIndividualInstructorAssignedScheduleRow[] {
  const filtered = input.assignments.filter(a => {
    if (a.instructorMemberId == null) return false
    if (String(a.instructorMemberId) !== input.instructorMemberId) return false
    const status = (a.assignmentStatus ?? '').toUpperCase()
    return status !== 'CANCELLED' && status !== 'CANCELED'
  })
  const n = filtered.length
  return filtered.map((a, index) => {
    const schoolId = resolveSchoolIdForAssignment(a, input.schoolRows)
    const school = input.schoolRows.find(s => s.id === schoolId)
    const scheduleId = a.scheduleId != null ? String(a.scheduleId) : ''
    const label = scheduleId ? input.scheduleLabelById.get(scheduleId) : undefined
    const lectureDate = extractLectureDateKey(a.lectureDate) ?? label?.date
    const scheduleLabel =
      [lectureDate, label?.time, label?.session].filter(Boolean).join(' | ') || '-'
    const assignmentId = a.assignmentId != null ? String(a.assignmentId) : `assign-${index}`
    return {
      id: assignmentId,
      no: n - index,
      role: a.scheduleLead ? 'lead' : 'assistant',
      slotKey: scheduleId || assignmentId,
      schoolId,
      lectureLocation: school?.schoolName ?? a.organizationName?.trim() ?? '-',
      distanceFromHome: formatApiDistanceKmDisplay(a.distanceKm, {
        longDistance: a.longDistance,
      }),
      scheduleLabel,
      assignmentId,
      instructorMemberId: input.instructorMemberId,
      scheduleId: scheduleId || undefined,
      organizationApplicationId:
        a.organizationApplicationId != null
          ? String(a.organizationApplicationId)
          : school?.organizationApplicationId,
    }
  })
}

/**
 * 개인형 대기 — 프로그램 일정(GET /programs/{id}/schedules, ACTIVE만 반환) 중 이 강사가 배정되지 않은 일정.
 * 다른 강사가 배정된 일정도 노출하고, scheduleId별 취소 제외 배정 강사 수가
 * maxAssignableInstructors 이상이면 배정 불가(unavailable)로 표시한다(값이 없으면 cap 없음). 서버 순서 유지.
 * 이 강사의 배정이 취소된 일정(재배정 없음)은 배정 취소(assignment_cancelled)로 표시한다.
 */
export function buildParticipatingInstructorWaitingScheduleRowsFromBoard(input: {
  instructor: ParticipatingInstructorRow
  schedules: ProgramScheduleResponse[]
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
  maxAssignableInstructors?: number | null
}): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const maxAssignableInstructors = normalizeMaxAssignableInstructors(input.maxAssignableInstructors)
  const ownScheduleIds = new Set<string>()
  const ownCancelledScheduleIds = new Set<string>()
  const instructorsBySchedule = new Map<string, Set<string>>()
  for (const a of input.assignments) {
    if (a.scheduleId == null || a.instructorMemberId == null) continue
    if (isCancelledAssignment(a)) {
      if (String(a.instructorMemberId) === input.instructorMemberId) {
        ownCancelledScheduleIds.add(String(a.scheduleId))
      }
      continue
    }
    const scheduleKey = String(a.scheduleId)
    const memberId = String(a.instructorMemberId)
    if (memberId === input.instructorMemberId) ownScheduleIds.add(scheduleKey)
    const members = instructorsBySchedule.get(scheduleKey) ?? new Set<string>()
    members.add(memberId)
    instructorsBySchedule.set(scheduleKey, members)
  }

  // 필수 사전교육(PRE_EDUCATION)은 강사 배정 후보가 아니다 — scheduleRole null(레거시)은 유지.
  const waiting = input.schedules.filter(
    (schedule): schedule is ProgramScheduleResponse & { id: number } =>
      schedule.id != null &&
      !ownScheduleIds.has(String(schedule.id)) &&
      !isProgramSchedulePreEducation(schedule)
  )
  const n = waiting.length
  return waiting.map((schedule, index) => {
    const scheduleKey = String(schedule.id)
    const label = input.scheduleLabelById.get(scheduleKey)
    const scheduleLabel =
      [label?.date, label?.time, label?.session].filter(Boolean).join(' | ') || '-'
    const assignedCount = instructorsBySchedule.get(scheduleKey)?.size ?? 0
    const atCap = maxAssignableInstructors != null && assignedCount >= maxAssignableInstructors
    return {
      id: `schedule-${scheduleKey}`,
      no: n - index,
      slotKey: scheduleKey,
      schoolId: scheduleKey,
      lectureLocation: schedule.locationName?.trim() || schedule.address?.trim() || '-',
      distanceFromHome: '-',
      scheduleLabel,
      assignmentStatus: ownCancelledScheduleIds.has(scheduleKey)
        ? 'assignment_cancelled'
        : atCap
          ? 'unavailable'
          : 'waiting',
      assignedInstructorCountLabel: '-',
      instructorApplicationId: input.instructor.instructorApplicationId,
      instructorMemberId: input.instructorMemberId,
      resolvedScheduleId: schedule.id,
    }
  })
}

/** remote OFF — mock 없이 빈 목록 */
export function buildEmptyParticipatingInstructorAssignmentRows(): {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
} {
  return { assignedSchools: [], waitingSchools: [] }
}
