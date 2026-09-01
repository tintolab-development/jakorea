/**
 * 참여 강사 풀페이지 — 기관 배정 현황 탭용 목 데이터
 */

import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import type { InstructorRoleKey } from '../model/school-detail-types'
import {
  buildParticipatingSchoolPreferredScheduleLines,
  buildParticipatingSchoolSessionLines,
} from './participating-school-session-display'

const MOCK_REQUIRED_INSTRUCTOR_SLOTS = 4

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

const ASSIGNED_DISTANCES = ['3km', '5km', '7km', '4km', '6km', '8km']

const WAITING_ASSIGNMENT_STATUSES = [
  'waiting',
  'assigned',
  'waiting',
  'assigned',
  'cancelled',
  'assigned',
  'waiting',
] as const

const WAITING_DISTANCES = ['2km', '4km', '6km', '5km', '7km', '32km', '12km']

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

function scheduleLinesForSchool(school: ParticipatingSchoolRow, rowSeed: number, idx: number): string[] {
  const fromSessions = buildParticipatingSchoolSessionLines(school.sessions)
  if (fromSessions.length > 0) return fromSessions

  const fallbackDates = ['2026. 01. 09(금)', '2026. 01. 10(토)', '2026. 01. 11(일)']
  const fallbackTimes = ['09:20 ~ 11:10', '09:20 ~ 11:20', '10:20 ~ 11:10']
  const fallbackSessions = [1, 2, 3, 4]
  const date = pick(fallbackDates, rowSeed % 3)
  const time = pick(fallbackTimes, idx % 3)
  const round = pick(fallbackSessions, idx % 4)
  return [`${date} ${time} | ${round}차시`]
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

/** 배정된 학교 3건 목업: 강사의 schoolName 학교 필수 포함 + 나머지 2교 */
export function buildInitialAssignedSchoolRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  _instructorList: ParticipatingInstructorRow[]
): InstructorAssignedSchoolRow[] {
  if (schools.length === 0) return []

  const seed = hash(instructor.id)
  const primary =
    schools.find(s => s.schoolName === instructor.schoolName) ?? schools[seed % schools.length]

  const rest = schools.filter(s => s.id !== primary.id)
  const sortedRest = [...rest].sort(
    (a, b) => hash(a.id + instructor.id) - hash(b.id + instructor.id)
  )
  const pickedSchools = [primary, ...sortedRest.slice(0, 2)]

  return pickedSchools.map((school, idx) => {
    const rowSeed = hash(school.id + instructor.id)
    return {
      id: school.id,
      no: pickedSchools.length - idx,
      role: idx === 0 ? ('lead' satisfies InstructorRoleKey) : ('assistant' satisfies InstructorRoleKey),
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
      educationScheduleLines: scheduleLinesForSchool(school, rowSeed, idx),
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
      const rowSeed = hash(school.id + instructor.id)
      return {
        id: school.id,
        no: n - idx,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: pick(WAITING_DISTANCES, rowSeed + idx),
        educationScheduleLines: scheduleLinesForSchool(school, rowSeed, idx),
        assignmentStatus: pick([...WAITING_ASSIGNMENT_STATUSES], rowSeed + idx),
        assignedInstructorCountLabel: instructorCountLabel(school.schoolName, instructorList),
      }
    })
  )
}

/** 1사1교 — 신청 기관 + 신청 일정별 배정 대기 행 */
export function buildWaitingSchoolScheduleRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[],
  assignedSchoolIds: Set<string>
): InstructorWaitingSchoolRow[] {
  const rows: InstructorWaitingSchoolRow[] = []
  const pool = schools.filter(s => !assignedSchoolIds.has(s.id))

  for (const school of pool) {
    const rowSeed = hash(school.id + instructor.id + 'w-schedule')
    const groups = scheduleGroupsForSchool(school)
    const sourceGroups =
      groups.length > 0
        ? groups
        : [
            {
              scheduleKey: `${school.id}|fallback`,
              sessions: [] as ParticipatingSchoolSession[],
              line: scheduleLinesForSchool(school, rowSeed, 0)[0] ?? '-',
            },
          ]

    sourceGroups.forEach((group, index) => {
      rows.push({
        id: `${school.id}__${group.scheduleKey}`,
        schoolId: school.id,
        scheduleKey: group.scheduleKey,
        sessions: group.sessions,
        no: 0,
        schoolName: school.schoolName,
        desiredGrade: school.educationGrade,
        region: school.region,
        distanceFromHome: pick(WAITING_DISTANCES, rowSeed + index),
        educationScheduleLines: [group.line],
        assignmentStatus: pick(['waiting', 'waiting', 'cancelled'] as const, rowSeed + index),
        assignedInstructorCountLabel: instructorCountLabel(school.schoolName, instructorList),
      })
    })
  }

  return renumberWaitingRows(rows.filter(row => row.assignmentStatus !== 'assigned'))
}

export function schoolRowToAssignedRow(
  school: ParticipatingSchoolRow,
  instructor: ParticipatingInstructorRow,
  _instructorList: ParticipatingInstructorRow[],
  no: number,
  role: InstructorRoleKey,
  idx: number
): InstructorAssignedSchoolRow {
  const rowSeed = hash(school.id + instructor.id)
  return {
    id: school.id,
    no,
    role,
    schoolName: school.schoolName,
    educationGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
    educationScheduleLines: scheduleLinesForSchool(school, rowSeed, idx),
  }
}

export function createWaitingRowForSchool(
  school: ParticipatingSchoolRow,
  instructor: ParticipatingInstructorRow,
  instructorList: ParticipatingInstructorRow[],
  no: number,
  assignmentStatus: InstructorWaitingAssignmentStatus = 'waiting'
): InstructorWaitingSchoolRow {
  const rowSeed = hash(school.id + instructor.id + 'back')
  return {
    id: school.id,
    no,
    schoolName: school.schoolName,
    desiredGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: pick(WAITING_DISTANCES, rowSeed),
    educationScheduleLines: scheduleLinesForSchool(school, rowSeed, 0),
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

export { MOCK_REQUIRED_INSTRUCTOR_SLOTS }
