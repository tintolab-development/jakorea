/**
 * 참여 봉사자 풀페이지 — 봉사 배정 현황 탭
 */

import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { formatVolunteerAssignmentScheduleLine } from './participating-school-session-display'
import {
  buildWaitingInstructorScheduleSlotKey,
  participatingSchoolSessionToHopeSchedule,
  resolveWaitingInstructorAssignmentStatus,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorAssignmentStatus,
  type WaitingInstructorHopeSchedule,
} from './waiting-instructor-assignment'
import { isGeneralProgramTempMockEnabled } from '@/features/program/general/api/temp-mock-capabilities'

/** 배정 대기 목록 — 기관+일정별 행 식별자 */
export type VolunteerWaitingAssignmentStatus = WaitingInstructorAssignmentStatus

export interface VolunteerAssignedInstitutionRow {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  region: string
  distanceFromHome: string
  volunteerScheduleLines: string[]
}

export interface VolunteerWaitingInstitutionRow {
  id: string
  no: number
  schoolId: string
  schoolName: string
  desiredGrade: string
  region: string
  distanceFromHome: string
  hopeScheduleLine: string
  hopeSchedule: WaitingInstructorHopeSchedule
  assignmentStatus: VolunteerWaitingAssignmentStatus
  assignedVolunteerCountLabel: string
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export function resolveVolunteerAssignmentSchoolPool(
  schoolRows: ParticipatingSchoolRow[]
): ParticipatingSchoolRow[] {
  return schoolRows
}

function scheduleLineForSession(
  session: ParticipatingSchoolSession,
  program?: Program
): string {
  return formatVolunteerAssignmentScheduleLine(session, program)
}

function scheduleLinesForSchool(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  program?: Program
): string[] {
  const fromSchool = school.sessions?.map(s => scheduleLineForSession(s, program)) ?? []
  if (fromSchool.length > 0) return fromSchool

  const volunteerSessions = volunteer.sessions ?? []
  if (volunteerSessions.length > 0) {
    return volunteerSessions.map(s => scheduleLineForSession(s, program))
  }

  return ['-']
}

function buildOccupiedVolunteerScheduleSlots(volunteer: ParticipatingVolunteerRow): Set<string> {
  const occupied = new Set<string>()
  for (const session of volunteer.sessions ?? []) {
    occupied.add(
      buildWaitingInstructorScheduleSlotKey(participatingSchoolSessionToHopeSchedule(session))
    )
  }
  return occupied
}

function countVolunteersAtInstitutionSession(
  volunteerList: ParticipatingVolunteerRow[],
  schoolName: string,
  session: ParticipatingSchoolSession
): number {
  const slotKey = buildWaitingInstructorScheduleSlotKey(
    participatingSchoolSessionToHopeSchedule(session)
  )
  let count = 0
  for (const v of volunteerList) {
    if (!v.assignedInstitutionNames.includes(schoolName)) continue
    for (const s of v.sessions ?? []) {
      if (
        buildWaitingInstructorScheduleSlotKey(participatingSchoolSessionToHopeSchedule(s)) ===
        slotKey
      ) {
        count += 1
        break
      }
    }
  }
  return count
}

function volunteerCountLabel(
  volunteerList: ParticipatingVolunteerRow[],
  schoolName: string,
  session: ParticipatingSchoolSession
): string {
  const n = countVolunteersAtInstitutionSession(volunteerList, schoolName, session)
  return `${n}명`
}

/** 배정된 기관 목록 — 기관 단위(한 기관에 복수 일정 가능) */
export function buildInitialVolunteerAssignedRows(
  volunteer: ParticipatingVolunteerRow,
  schoolRows: ParticipatingSchoolRow[],
  program?: Program
): VolunteerAssignedInstitutionRow[] {
  const schoolPool = resolveVolunteerAssignmentSchoolPool(schoolRows)
  const assignedNames = volunteer.assignedInstitutionNames ?? []
  if (assignedNames.length === 0) return []

  const picked = assignedNames
    .map(name => schoolPool.find(s => s.schoolName === name))
    .filter((s): s is ParticipatingSchoolRow => Boolean(s))

  if (picked.length === 0) return []

  return picked.map((school, idx) => {
    return {
      id: `${school.id}__assigned`,
      no: picked.length - idx,
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: '-',
      volunteerScheduleLines: scheduleLinesForSchool(school, volunteer, program),
    }
  })
}

function expandSchoolSessionsToWaitingRows(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  volunteerList: ParticipatingVolunteerRow[],
  occupiedSlots: Set<string>,
  program?: Program
): VolunteerWaitingInstitutionRow[] {
  const sessions = school.sessions?.filter(s => s.status !== 'not_planned') ?? []
  if (sessions.length === 0) return []

  return sessions.map((session, sessionIdx) => {
    const hopeSchedule = participatingSchoolSessionToHopeSchedule(session)
    const isTemporaryVolunteer =
      isGeneralProgramTempMockEnabled() && volunteer.id.startsWith('temp-progress-volunteer-')
    return {
      id: `${school.id}__${session.date}__${session.round}`,
      no: 0,
      schoolId: school.id,
      schoolName: school.schoolName,
      desiredGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: '-',
      hopeScheduleLine: scheduleLineForSession(session, program),
      hopeSchedule,
      // TODO(temp-mock): 열여라 참깨 — 봉사 배정 대기/불가 검증 후 삭제
      assignmentStatus: isTemporaryVolunteer
        ? sessionIdx % 2 === 0
          ? 'waiting'
          : 'unavailable'
        : resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedSlots),
      assignedVolunteerCountLabel: volunteerCountLabel(volunteerList, school.schoolName, session),
    }
  })
}

/** 배정 대기 기관 목록 — 기관+일정별 행 분리, 배정 완료 건 비노출 */
export function buildVolunteerWaitingInstitutionRows(
  volunteer: ParticipatingVolunteerRow,
  schoolRows: ParticipatingSchoolRow[],
  volunteerList: ParticipatingVolunteerRow[],
  assignedRowIds: Set<string>,
  program?: Program
): VolunteerWaitingInstitutionRow[] {
  const schoolPool = resolveVolunteerAssignmentSchoolPool(schoolRows)
  const assignedSchoolIds = new Set(
    [...assignedRowIds].map(id => id.split('__assigned')[0] ?? id)
  )
  const occupiedSlots = buildOccupiedVolunteerScheduleSlots(volunteer)
  const candidateSchools = schoolPool.filter(s => !assignedSchoolIds.has(s.id))

  const sorted = [...candidateSchools].sort(
    (a, b) => hash(a.id + volunteer.id + 'w') - hash(b.id + volunteer.id + 'w')
  )

  const expanded = sorted.flatMap(school =>
    expandSchoolSessionsToWaitingRows(school, volunteer, volunteerList, occupiedSlots, program)
  )

  const n = expanded.length
  return sortWaitingInstructorRowsUnavailableToBottom(
    expanded.map((row, idx) => ({ ...row, no: n - idx }))
  )
}

export function schoolRowToVolunteerAssignedRow(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  no: number,
  _idx: number,
  program?: Program
): VolunteerAssignedInstitutionRow {
  return {
    id: `${school.id}__assigned`,
    no,
    schoolName: school.schoolName,
    educationGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: '-',
    volunteerScheduleLines: scheduleLinesForSchool(school, volunteer, program),
  }
}

export function renumberVolunteerAssignedRows(
  rows: VolunteerAssignedInstitutionRow[]
): VolunteerAssignedInstitutionRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberVolunteerWaitingRows(
  rows: VolunteerWaitingInstitutionRow[]
): VolunteerWaitingInstitutionRow[] {
  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}
