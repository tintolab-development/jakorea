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
      distanceFromHome: formatApiDistanceKmDisplay(primary.distanceKm, { longDistanceSuffix: true }),
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

/** 강사 무관 — 취소되지 않은 배정이 있는 (기관 신청 + scheduleId) 키. 신청 id가 없으면 기관명으로 묶는다. */
function buildAssignedScheduleKeys(
  assignments: InstructorAssignmentListItemEnriched[]
): Set<string> {
  const keys = new Set<string>()
  for (const a of assignments) {
    if (a.scheduleId == null || isCancelledAssignment(a)) continue
    if (a.organizationApplicationId != null) {
      keys.add(assignedScheduleKey(`app:${a.organizationApplicationId}`, a.scheduleId))
      continue
    }
    const orgName = a.organizationName?.trim()
    if (orgName) keys.add(assignedScheduleKey(`name:${orgName}`, a.scheduleId))
  }
  return keys
}

function isSessionAssignedToAnyInstructor(
  school: ParticipatingSchoolRow,
  session: ParticipatingSchoolSession,
  assignedScheduleKeys: Set<string>
): boolean {
  const scheduleId = session.resolvedScheduleId
  if (scheduleId == null) return false
  const orgAppId = school.organizationApplicationId
  if (orgAppId && assignedScheduleKeys.has(assignedScheduleKey(`app:${orgAppId}`, scheduleId))) {
    return true
  }
  return assignedScheduleKeys.has(assignedScheduleKey(`name:${school.schoolName}`, scheduleId))
}

/** 강사 관점 배정 대기 — 기관×확정 일정 중 어느 강사에게도 배정되지 않은 슬롯 */
export function buildParticipatingInstructorWaitingSchoolRowsFromBoard(input: {
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  assignedSchoolIds: Set<string>
  isCompanySchool: boolean
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
}): InstructorWaitingSchoolRow[] {
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

  const assignedScheduleKeys = buildAssignedScheduleKeys(input.assignments)

  const rows: InstructorWaitingSchoolRow[] = []
  let rowNo = 0

  for (const school of input.schoolRows) {
    if (input.assignedSchoolIds.has(school.id)) continue
    const orgAppId = school.organizationApplicationId
    if (orgAppId && assignedOrgAppIds.has(orgAppId)) continue

    const assignmentSessions = getParticipatingSchoolAssignmentSessions(school).filter(
      session => !isSessionAssignedToAnyInstructor(school, session, assignedScheduleKeys)
    )
    if (assignmentSessions.length === 0) continue

    if (input.isCompanySchool) {
      const groups = buildScheduleGroups(assignmentSessions)
      for (const group of groups) {
        rowNo += 1
        const assignmentStatus = resolveWaitingAssignmentStatus(group.sessions)
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
      continue
    }

    rowNo += 1
    rows.push({
      id: school.id,
      no: rowNo,
      schoolId: school.id,
      sessions: assignmentSessions,
      schoolName: school.schoolName,
      desiredGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: '-',
      educationScheduleLines: buildParticipatingSchoolSessionLines(assignmentSessions),
      assignmentStatus: resolveWaitingAssignmentStatus(assignmentSessions),
      assignedInstructorCountLabel: '-',
      organizationApplicationId: orgAppId,
      instructorApplicationId: input.instructor.instructorApplicationId,
      instructorMemberId: input.instructorMemberId,
    })
  }

  return sortWaitingRowsAssignedToBottom(rows)
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
      distanceFromHome: formatApiDistanceKmDisplay(a.distanceKm, { longDistanceSuffix: true }),
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

/** 개인형 대기 — 기관 waiting을 일정 행으로 펼침 */
export function buildParticipatingInstructorWaitingScheduleRowsFromBoard(input: {
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  assignedSchoolIds: Set<string>
  assignments: InstructorAssignmentListItemEnriched[]
  instructorMemberId: string
}): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const waiting = buildParticipatingInstructorWaitingSchoolRowsFromBoard({
    ...input,
    isCompanySchool: true,
  })
  return waiting.map((row, index) => ({
    id: row.id,
    no: waiting.length - index,
    slotKey: row.scheduleKey ?? row.id,
    schoolId: row.schoolId ?? row.id,
    lectureLocation: row.schoolName,
    distanceFromHome: row.distanceFromHome,
    scheduleLabel: row.educationScheduleLines[0] ?? '-',
    assignmentStatus:
      row.assignmentStatus === 'no_assignable_schedule'
        ? 'no_assignable_schedule'
        : row.assignmentStatus === 'cancelled'
          ? 'unavailable'
          : 'waiting',
    assignedInstructorCountLabel: row.assignedInstructorCountLabel,
    organizationApplicationId: row.organizationApplicationId,
    instructorApplicationId: row.instructorApplicationId,
    instructorMemberId: row.instructorMemberId,
    requestedScheduleId: row.requestedScheduleId,
    resolvedScheduleId: row.resolvedScheduleId,
    scheduleUnresolved: row.scheduleUnresolved,
    sessions: row.sessions,
  }))
}

/** remote OFF — mock 없이 빈 목록 */
export function buildEmptyParticipatingInstructorAssignmentRows(): {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
} {
  return { assignedSchools: [], waitingSchools: [] }
}
