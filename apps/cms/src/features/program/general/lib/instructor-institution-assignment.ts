/**
 * 참여 강사 풀페이지 — 기관 배정 현황 탭
 */

import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { InstructorRoleKey } from '../model/school-detail-types'
import {
  buildParticipatingSchoolPreferredScheduleLines,
  buildParticipatingSchoolSessionLines,
} from './participating-school-session-display'
import { isGeneralProgramTempMockEnabled } from '@/features/program/general/api/temp-mock-capabilities'
import { isTempMockOrgProgressInstructorId } from '@/features/program/general/lib/temp-mock-org-program'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export type InstructorWaitingAssignmentStatus = 'waiting' | 'cancelled' | 'assigned'

/** 배정 완료 행은 No.와 무관하게 목록 하단에 노출 */
export function sortWaitingRowsAssignedToBottom<
  T extends { no: number; assignmentStatus: InstructorWaitingAssignmentStatus },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aAssigned = a.assignmentStatus === 'assigned' ? 1 : 0
    const bAssigned = b.assignmentStatus === 'assigned' ? 1 : 0
    if (aAssigned !== bAssigned) return aAssigned - bAssigned
    return b.no - a.no
  })
}

export interface InstructorAssignedSchoolRow {
  id: string
  no: number
  role: InstructorRoleKey
  schoolName: string
  educationGrade: string
  region: string
  distanceFromHome: string
  educationScheduleLines: string[]
  /** remote — cancel / representative */
  assignmentId?: string
  assignmentIds?: string[]
  instructorMemberId?: string
  scheduleId?: string
  organizationApplicationId?: string
  schoolId?: string
}

export interface InstructorWaitingSchoolRow {
  id: string
  no: number
  schoolId?: string
  scheduleKey?: string
  sessions?: ParticipatingSchoolSession[]
  schoolName: string
  desiredGrade: string
  region: string
  distanceFromHome: string
  educationScheduleLines: string[]
  assignmentStatus: InstructorWaitingAssignmentStatus
  assignedInstructorCountLabel: string
  /** assignment create API */
  organizationApplicationId?: string
  instructorApplicationId?: string
  instructorMemberId?: string
  requestedScheduleId?: number
  resolvedScheduleId?: number | null
  scheduleUnresolved?: boolean
}

function countInstructorsAtSchool(
  schoolName: string,
  instructorList: ParticipatingInstructorRow[]
): number {
  return instructorList.filter(r => r.schoolName === schoolName).length
}

function instructorCountLabel(schoolName: string, instructorList: ParticipatingInstructorRow[]): string {
  const n = countInstructorsAtSchool(schoolName, instructorList)
  return `${n}명`
}

function scheduleLinesForSchool(school: ParticipatingSchoolRow): string[] {
  const fromSessions = buildParticipatingSchoolSessionLines(school.sessions)
  return fromSessions.length > 0 ? fromSessions : ['-']
}

function scheduleGroupsForSchool(
  school: ParticipatingSchoolRow
): Array<{ scheduleKey: string; sessions: ParticipatingSchoolSession[]; line: string }> {
  const groups = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of school.sessions?.filter(s => s.status !== 'not_planned') ?? []) {
    const scheduleKey = `${session.date}|${session.dayOfWeek}`
    const prev = groups.get(scheduleKey)
    if (prev) prev.push(session)
    else groups.set(scheduleKey, [session])
  }

  const preferredLines = buildParticipatingSchoolPreferredScheduleLines(school.sessions)
  return Array.from(groups.entries()).map(([scheduleKey, sessions], index) => ({
    scheduleKey,
    sessions,
    line: preferredLines[index] ?? buildParticipatingSchoolSessionLines(sessions)[0] ?? '-',
  }))
}

/** 배정된 학교 — instructor.schoolName / assignedOrganizationNames 에 실제 매칭되는 기관만 */
export function buildInitialAssignedSchoolRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  _instructorList: ParticipatingInstructorRow[]
): InstructorAssignedSchoolRow[] {
  if (schools.length === 0) return []

  const assignedNames = new Set(
    [instructor.schoolName, ...(instructor.assignedOrganizationNames ?? [])]
      .map(name => name?.trim())
      .filter((name): name is string => Boolean(name))
  )

  let pickedSchools = schools.filter(school => assignedNames.has(school.schoolName))

  // TODO(temp-mock): 열여라 참깨 — 참여 강사·배정 현황 검증 후 삭제
  const isTemporaryInstructor =
    isGeneralProgramTempMockEnabled() &&
    (isTempMockOrgProgressInstructorId(instructor.id) ||
      instructor.id.startsWith('temp-progress-instructor-'))
  if (pickedSchools.length === 0 && isTemporaryInstructor) {
    const seed = hash(instructor.id)
    const primary =
      schools.find(s => s.schoolName === instructor.schoolName) ?? schools[seed % schools.length]
    pickedSchools = primary ? [primary] : []
  }

  return pickedSchools.map((school, idx) => {
    return {
      id: school.id,
      no: pickedSchools.length - idx,
      role: idx === 0 ? ('lead' satisfies InstructorRoleKey) : ('assistant' satisfies InstructorRoleKey),
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: '-',
      educationScheduleLines: scheduleLinesForSchool(school),
    }
  })
}

/** 배정되지 않은 학교 목록 (배정 대기 테이블) */
export function buildWaitingSchoolRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[],
  assignedSchoolIds: Set<string>
): InstructorWaitingSchoolRow[] {
  const pool = schools.filter(s => !assignedSchoolIds.has(s.id))
  const sorted = [...pool].sort(
    (a, b) => hash(a.id + instructor.id + 'w') - hash(b.id + instructor.id + 'w')
  )
  const slice = sorted.slice(0, 12)
  const n = slice.length

  return sortWaitingRowsAssignedToBottom(
    slice.map((school, idx) => {
      return {
        id: school.id,
        no: n - idx,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: '-',
        educationScheduleLines: scheduleLinesForSchool(school),
        // TODO(temp-mock): 열여라 참깨 — 배정 대기/불가/완료 검증 후 삭제
        assignmentStatus:
          isGeneralProgramTempMockEnabled() &&
          (isTempMockOrgProgressInstructorId(instructor.id) ||
            instructor.id.startsWith('temp-progress-instructor-'))
            ? (['waiting', 'cancelled', 'assigned'] as const)[idx % 3]
            : ('waiting' as const),
        assignedInstructorCountLabel: instructorCountLabel(school.schoolName, instructorList),
      }
    })
  )
}

/** 1사1교 — 신청 기관 + 신청 일정별 배정 대기 행 */
export function buildWaitingSchoolScheduleRows(
  _instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[],
  assignedSchoolIds: Set<string>
): InstructorWaitingSchoolRow[] {
  const rows: InstructorWaitingSchoolRow[] = []
  const pool = schools.filter(s => !assignedSchoolIds.has(s.id))

  for (const school of pool) {
    const groups = scheduleGroupsForSchool(school)
    if (groups.length === 0) continue

    groups.forEach(group => {
      rows.push({
        id: `${school.id}__${group.scheduleKey}`,
        schoolId: school.id,
        scheduleKey: group.scheduleKey,
        sessions: group.sessions,
        no: 0,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: '-',
        educationScheduleLines: [group.line],
        assignmentStatus: 'waiting',
        assignedInstructorCountLabel: instructorCountLabel(school.schoolName, instructorList),
      })
    })
  }

  return renumberWaitingRows(rows.filter(row => row.assignmentStatus !== 'assigned'))
}

export function schoolRowToAssignedRow(
  school: ParticipatingSchoolRow,
  _instructor: ParticipatingInstructorRow,
  _instructorList: ParticipatingInstructorRow[],
  no: number,
  role: InstructorRoleKey,
  _idx: number
): InstructorAssignedSchoolRow {
  return {
    id: school.id,
    no,
    role,
    schoolName: school.schoolName,
    educationGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: '-',
    educationScheduleLines: scheduleLinesForSchool(school),
  }
}

export function createWaitingRowForSchool(
  school: ParticipatingSchoolRow,
  _instructor: ParticipatingInstructorRow,
  instructorList: ParticipatingInstructorRow[],
  no: number,
  assignmentStatus: InstructorWaitingAssignmentStatus = 'waiting'
): InstructorWaitingSchoolRow {
  return {
    id: school.id,
    no,
    schoolName: school.schoolName,
    desiredGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: '-',
    educationScheduleLines: scheduleLinesForSchool(school),
    assignmentStatus,
    assignedInstructorCountLabel: instructorCountLabel(school.schoolName, instructorList),
  }
}

/** No. 컬럼 재계산 (내림차순) */
export function renumberAssignedRows(rows: InstructorAssignedSchoolRow[]): InstructorAssignedSchoolRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberWaitingRows(rows: InstructorWaitingSchoolRow[]): InstructorWaitingSchoolRow[] {
  const sorted = sortWaitingRowsAssignedToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}

/** TODO(temp-mock): 참여 강사 상세 — 로컬 기관 배정 */
export function applyLocalParticipatingInstructorAssign(input: {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
  rowsToAssign: InstructorWaitingSchoolRow[]
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
  role: InstructorRoleKey
}): {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
} {
  const assignIds = new Set(input.rowsToAssign.map(row => row.id))
  const assignedSchoolIds = new Set(input.assignedSchools.map(row => row.id))
  const nextWaiting = renumberWaitingRows(
    input.waitingSchools.filter(row => !assignIds.has(row.id))
  )
  const nextAssigned = [...input.assignedSchools]
  let hasLead = nextAssigned.some(row => row.role === 'lead')

  for (const waitingRow of input.rowsToAssign) {
    const schoolId = waitingRow.schoolId ?? waitingRow.id
    if (assignedSchoolIds.has(schoolId)) continue
    const school = input.schoolRows.find(item => item.id === schoolId)
    if (!school) continue
    const role: InstructorRoleKey =
      !hasLead && input.role === 'lead' ? 'lead' : hasLead ? 'assistant' : input.role
    if (role === 'lead') hasLead = true
    nextAssigned.push(
      schoolRowToAssignedRow(
        school,
        input.instructor,
        input.instructorList,
        nextAssigned.length + 1,
        role,
        nextAssigned.length
      )
    )
    assignedSchoolIds.add(schoolId)
  }

  return {
    assignedSchools: renumberAssignedRows(nextAssigned),
    waitingSchools: nextWaiting,
  }
}

/** TODO(temp-mock): 참여 강사 상세 — 로컬 기관 배정 취소 */
export function applyLocalParticipatingInstructorUnassign(input: {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
  selectedAssignedIds: string[]
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  instructorList: ParticipatingInstructorRow[]
}): {
  assignedSchools: InstructorAssignedSchoolRow[]
  waitingSchools: InstructorWaitingSchoolRow[]
} {
  const removeIds = new Set(input.selectedAssignedIds)
  const removedRows = input.assignedSchools.filter(row => removeIds.has(row.id))
  const nextAssigned = renumberAssignedRows(
    input.assignedSchools.filter(row => !removeIds.has(row.id))
  )
  const waitingSchoolIds = new Set(
    input.waitingSchools.map(row => row.schoolId ?? row.id)
  )
  const restoredWaiting = [...input.waitingSchools]

  for (const removed of removedRows) {
    if (waitingSchoolIds.has(removed.id)) continue
    const school = input.schoolRows.find(item => item.id === removed.id)
    if (!school) continue
    restoredWaiting.push(
      createWaitingRowForSchool(school, input.instructor, input.instructorList, 0, 'waiting')
    )
    waitingSchoolIds.add(school.id)
  }

  return {
    assignedSchools: nextAssigned,
    waitingSchools: renumberWaitingRows(restoredWaiting),
  }
}

/** TODO(temp-mock): 참여 강사·기관 상세 — 대표 강사 로컬 변경 */
export function applyLocalInstructorLeadRoleChange<T extends { id: string; role: InstructorRoleKey }>(
  rows: T[],
  instructorId: string,
  newRole: InstructorRoleKey
): T[] {
  if (newRole !== 'lead') return rows
  return rows.map(row => {
    if (row.id === instructorId) return { ...row, role: 'lead' as const }
    if (row.role === 'lead') return { ...row, role: 'assistant' as const }
    return row
  })
}
